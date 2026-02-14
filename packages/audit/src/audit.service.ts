/**
 * Audit Logging Service
 * S4 Protocol: Immutable Audit Logs
 */

import { getCurrentTenantId } from '@apex/middleware';
import { EncryptionService } from '@apex/security';
import { Inject, Injectable, Logger } from '@nestjs/common';

// Define types missing in original file but required by index/tests
export type AuditAction = string;
export type AuditSeverity = 'INFO' | 'HIGH' | 'CRITICAL';

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
const AuditMetadataSchema = z.record(z.any()).refine((data) => {
  // Anti-Prototype Pollution: Prevent __proto__, constructor, prototype
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
  metadata?: Record<string, any>;
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
  private pool: any;

  constructor(
    @Inject('DATABASE_POOL') pool: any,
    @Inject(EncryptionService) encryption?: EncryptionService
  ) {
    this.pool = pool;
    this.encryption = encryption || new EncryptionService();
  }

  /**
   * Log a security or system event
   * S4: This logs to an immutable table in the public schema
   * @param entry - Audit log data
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const tenantId = entry.tenantId || getCurrentTenantId() || 'system';
    const timestamp = new Date();

    // 🔒 S11 Protection: Validate metadata structure
    const validatedMetadata = AuditMetadataSchema.parse(entry.metadata || {});

    // 🔒 S7 Protection: Encrypt PII before logging
    const encryptedEmail = entry.userEmail
      ? this.encryption.encrypt(entry.userEmail)
      : { encrypted: null };

    const rawMetadata = {
      ...validatedMetadata,
      ...(entry.errorMessage ? { error: entry.errorMessage } : {}),
    };
    const encryptedMetadata = this.encryption.encrypt(
      JSON.stringify(rawMetadata)
    );

    // 1. Console Logging (Sanitized for S4 monitoring)
    const logOutput = JSON.stringify({
      level: 'audit',
      tenantId,
      timestamp,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: entry.userId,
      userEmail: '[REDACTED]', // S7: Redact PII in console
      metadata: '[ENCRYPTED]', // S7: Redact PII in console
      severity: entry.severity,
    });
    // eslint-disable-next-line no-console
    console.log(logOutput);
    Logger.log(
      `[AUDIT] ${entry.action} - ${entry.entityId}`,
      AuditService.name
    );

    // 2. Persistent Logging (S4 Protocol)
    // S4 FIX: Store encrypted PII for GDPR/S7 compliance
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SET search_path TO public');

        await client.query(
          `INSERT INTO public.audit_logs (
              tenant_id, 
              user_id, 
              user_email,
              action, 
              entity_type, 
              entity_id, 
              metadata, 
              ip_address, 
              user_agent,
              severity,
              result,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            tenantId,
            entry.userId || null,
            encryptedEmail.encrypted,
            entry.action,
            entry.entityType, // Schema uses entity_type
            entry.entityId, // Schema uses entity_id
            encryptedMetadata, // Store the whole encrypted object { encrypted: ... } as JSONB
            entry.ipAddress || null,
            entry.userAgent || null,
            entry.severity || 'INFO',
            entry.result || entry.status || 'SUCCESS',
            timestamp,
          ]
        );
      } finally {
        try {
          await client.query('SET search_path TO public');
        } catch {}
        client.release();
      }
    } catch (error) {
      this.logger.error(
        'S4 CRITICAL: Audit Persistence Failure',
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Initialize S4 Protection
   * Ensures the audit_logs table and its immutability triggers exist
   */
  async initializeS4(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // 0. Ensure public schema (S2 Enforcement)
      await client.query('SET search_path TO public');

      // 1. Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id TEXT NOT NULL,
          user_id TEXT,
          user_email TEXT,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          metadata JSONB,
          ip_address TEXT,
          user_agent TEXT,
          severity TEXT DEFAULT 'INFO',
          result TEXT DEFAULT 'SUCCESS',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 2. Create performance indexes
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(created_at)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_audit_tenant ON public.audit_logs(tenant_id)'
      );

      // 2. Create immutability triggers
      // Prevent UPDATE
      await client.query(`
        CREATE OR REPLACE FUNCTION protect_audit_log_update() RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'S4 Violation: Audit logs are immutable and cannot be updated.';
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_protect_audit_update ON public.audit_logs;
        CREATE TRIGGER trg_protect_audit_update 
        BEFORE UPDATE ON public.audit_logs 
        FOR EACH ROW EXECUTE FUNCTION protect_audit_log_update();
      `);

      // Prevent DELETE
      await client.query(`
        CREATE OR REPLACE FUNCTION protect_audit_log_delete() RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'S4 Violation: Audit logs are immutable and cannot be deleted.';
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_protect_audit_delete ON public.audit_logs;
        CREATE TRIGGER trg_protect_audit_delete 
        BEFORE DELETE ON public.audit_logs 
        FOR EACH ROW EXECUTE FUNCTION protect_audit_log_delete();
      `);

      // Prevent TRUNCATE (S4 Deep Hardening)
      await client.query(`
        CREATE OR REPLACE FUNCTION protect_audit_log_truncate() RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'S4 Violation: Audit logs are immutable and cannot be truncated.';
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_protect_audit_truncate ON public.audit_logs;
        CREATE TRIGGER trg_protect_audit_truncate 
        BEFORE TRUNCATE ON public.audit_logs 
        FOR EACH STATEMENT EXECUTE FUNCTION protect_audit_log_truncate();
      `);

      this.logger.log('S4 Immutable Auditing active.');
    } finally {
      client.release();
    }
  }
}

// --- Standalone Functions for functional usage & tests ---
// DEPRECATED/REMOVED: Standalone functions removed to force DI usage
// export async function initializeAuditTable() ...
// export async function log(entry: AuditLogEntry) ...
