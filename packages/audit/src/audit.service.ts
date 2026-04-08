import * as crypto from 'node:crypto';
/**
 * Audit Logging Service
 * S4 Protocol: Immutable Audit Logs
 */

import { adminPool, SYSTEM_TENANT_ID } from '@apex/db';
import { getCurrentTenantId } from '@apex/middleware';
import { EncryptionService } from '@apex/security';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

// Define types missing in original file but required by index/tests
export type AuditAction = string;
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY_ALERT';

/**
 * Interface for Drizzle executor session client (S4 Reset Protocol)
 */
export interface PgPoolClient {
  query: (
    q: string,
    params?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  release: (destroy?: boolean) => void;
}

/**
 * Interface for DB Pool
 */
export interface PgPool {
  connect: () => Promise<PgPoolClient>;
  query?: (
    q: string,
    params?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
}

import { z } from 'zod';

export const SecurityEvents = {
  TENANT_PROVISIONED: 'TENANT_PROVISIONED',
  HONEYPOT_HIT: 'HONEYPOT_HIT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  KEY_ROTATION: 'KEY_ROTATION',
} as const;

/**
 * S11: Metadata Schema Validation
 * Prevents Prototype Pollution and malformed data in JSONB columns
 */
const AuditMetadataSchema = z.record(z.unknown()).refine((data) => {
  // S11: Simple strict check against reserved keys
  const forbidden = ['__proto__', 'constructor', 'prototype'];
  return !Object.keys(data).some((key) => forbidden.includes(key));
}, 'S11 Violation: Potential Prototype Pollution detected in metadata');

export interface AuditQueryOptions {
  tenantId?: string;
  action?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userEmail?: string; // S4: User email for audit trail
  tenantId?: string;
  actorType?: 'super_admin' | 'tenant_admin' | 'system';
  publicKey?: string;
  encryptedKey?: Buffer;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date; // Added for test compatibility
  severity?: AuditSeverity;
  result?: string;
  status?: string; // Standardize to status to match implementation logic if needed, but keeping result for now
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private encryption: EncryptionService;
  private pool: PgPool;

  constructor(
    @Optional() @Inject('DATABASE_POOL') pool: PgPool | null,
    @Inject(EncryptionService) encryption: EncryptionService
  ) {
    this.pool = pool || (adminPool as PgPool);
    this.encryption = encryption;
  }

  /**
   * Log a security or system event
   * S4: This logs to an immutable table in the public schema
   * @param entry - Audit log data
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const rawTenantId = entry.tenantId || getCurrentTenantId() || SYSTEM_TENANT_ID;
    const tenantId = this.normalizeTenantId(rawTenantId);
    const timestamp = new Date();

    const encryptedMetadata = this.prepareMetadata(entry);
    this.consoleLog(tenantId, timestamp, entry);

    try {
      await this.persistLog(tenantId, timestamp, entry, encryptedMetadata);
    } catch (error) {
      this.logger.error(
        'S4 CRITICAL: Audit Persistence Failure',
        error instanceof Error ? error.message : error
      );
      throw new Error('Audit Persistence Failure');
    }
  }

  private prepareMetadata(entry: AuditLogEntry): string {
    const validatedMetadata = AuditMetadataSchema.parse(entry.metadata || {});
    const rawMetadata = {
      ...validatedMetadata,
      ...(entry.errorMessage ? { error: entry.errorMessage } : {}),
    };
    return JSON.stringify(this.encryption.encrypt(JSON.stringify(rawMetadata)));
  }

  private consoleLog(
    tenantId: string,
    timestamp: Date,
    entry: AuditLogEntry
  ): void {
    const logOutput = JSON.stringify({
      level: 'audit',
      tenantId,
      timestamp,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: entry.userId,
      userEmail: '[REDACTED]',
      metadata: '[ENCRYPTED]',
      userAgent: entry.userAgent,
      severity: entry.severity,
      result: entry.result || entry.status || 'SUCCESS',
    });
    process.stdout.write(`${logOutput}\n`);
  }

  private determineActorType(entry: AuditLogEntry, tenantId: string): string {
    if (entry.actorType) return entry.actorType;
    if (tenantId === SYSTEM_TENANT_ID || entry.action.includes('SUPER_ADMIN')) {
      return 'super_admin';
    }
    return 'tenant_admin';
  }

  private async persistLog(
    tenantId: string,
    timestamp: Date,
    entry: AuditLogEntry,
    encryptedMetadata: string
  ): Promise<void> {
    const actorType = this.determineActorType(entry, tenantId);
    const publicKey = entry.publicKey || 'S4_STUB';
    const encryptedKey = entry.encryptedKey || Buffer.from([0x00]);

    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO governance.audit_logs (
            tenant_id, user_id, user_email, action, entity_type, entity_id, 
            metadata, ip_address, user_agent, severity, result, checksum, 
            created_at, actor_type, public_key, encrypted_key
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          tenantId,
          entry.userId || null,
          entry.userEmail
            ? JSON.stringify(this.encryption.encrypt(entry.userEmail))
            : null,
          entry.action,
          entry.entityType,
          entry.entityId,
          encryptedMetadata,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.severity || 'INFO',
          entry.result || entry.status || 'SUCCESS',
          this.calculateChecksum({
            tenantId,
            action: entry.action,
            entityId: entry.entityId,
            timestamp,
          }),
          timestamp,
          actorType,
          publicKey,
          encryptedKey,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Item 42: Calculate HMAC checksum for log integrity
   */
  private calculateChecksum(data: unknown): string {
    /* crypto imported at top */
    const hmacKey =
      process.env['AUDIT_HMAC_KEY'] || 'default-audit-hardened-key-32-chars!!';
    return crypto
      .createHmac('sha256', hmacKey)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * S4: Normalize tenantId to handle "system" string or invalid formats
   */
  private normalizeTenantId(id: string | null | undefined): string {
    if (!id || id === 'system' || id === 'admin') {
      return SYSTEM_TENANT_ID;
    }

    // S4: Strict UUID pattern check
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      this.logger.warn(`S4: Received non-UUID tenantId: "${id}". Falling back to system.`);
      return SYSTEM_TENANT_ID;
    }

    return id;
  }
}

// --- Standalone Functions for functional usage & tests ---
// 🛡️ Note: These are legacy wrappers around the AuditService.
// They use a default instance for backward compatibility in tests.

import { ConfigService } from '@apex/config/service';

let defaultService: AuditService | null = null;
function getService(): AuditService {
  if (!defaultService) {
    const config = new ConfigService();
    const encryption = new EncryptionService(config);
    defaultService = new AuditService(adminPool, encryption);
  }
  return defaultService;
}

export async function log(entry: AuditLogEntry): Promise<void> {
  return getService().log(entry);
}

export async function logProvisioning(
  storeName: string,
  tier: string,
  userId: string,
  ip: string,
  success: boolean
): Promise<void> {
  return getService().log({
    action: SecurityEvents.TENANT_PROVISIONED,
    entityType: 'tenant',
    entityId: storeName,
    userId,
    ipAddress: ip,
    result: success ? 'SUCCESS' : 'FAILURE',
    metadata: { tier },
  });
}

export async function logSecurityEvent(
  event: string,
  actor: string,
  target: string,
  ip?: string
): Promise<void> {
  return getService().log({
    action: event,
    entityType: 'security',
    entityId: target,
    userId: actor,
    ipAddress: ip,
    severity: 'CRITICAL',
  });
}

export async function query(options: AuditQueryOptions): Promise<unknown[]> {
  const client = await adminPool.connect();
  try {
    // S2: Using schema-qualified query — no SET search_path needed
    const { rows } = await client.query(
      'SELECT * FROM governance.audit_logs WHERE tenant_id = $1 AND action = $2',
      [options.tenantId, options.action]
    );
    return rows;
  } finally {
    client.release();
  }
}
