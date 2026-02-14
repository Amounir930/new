/**
 * Audit Logging Service
 * S4 Protocol: Immutable Audit Logs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuditService_1;
import { getCurrentTenantId } from '@apex/middleware';
import { EncryptionService } from '@apex/security';
import { Inject, Injectable, Logger } from '@nestjs/common';
export const SecurityEvents = {
    TENANT_PROVISIONED: 'TENANT_PROVISIONED',
    HONEYPOT_HIT: 'HONEYPOT_HIT',
    SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
    KEY_ROTATION: 'KEY_ROTATION',
};
let AuditService = AuditService_1 = class AuditService {
    logger = new Logger(AuditService_1.name);
    encryption;
    pool;
    constructor(pool, encryption) {
        this.pool = pool;
        this.encryption = encryption || new EncryptionService();
    }
    /**
     * Log a security or system event
     * S4: This logs to an immutable table in the public schema
     * @param entry - Audit log data
     */
    async log(entry) {
        const tenantId = entry.tenantId || getCurrentTenantId() || 'system';
        const timestamp = new Date();
        // 🔒 S7 Protection: Encrypt PII before logging
        const encryptedEmail = entry.userEmail
            ? this.encryption.encrypt(entry.userEmail)
            : { encrypted: null };
        const rawMetadata = {
            ...(entry.metadata || {}),
            ...(entry.errorMessage ? { error: entry.errorMessage } : {}),
        };
        const encryptedMetadata = this.encryption.encrypt(JSON.stringify(rawMetadata));
        // 1. Console Logging (Sanitized for S4 monitoring)
        const logOutput = JSON.stringify({
            level: 'audit',
            tenantId,
            timestamp,
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            userId: entry.userId,
            severity: entry.severity,
        });
        // eslint-disable-next-line no-console
        console.log(logOutput);
        Logger.log(`[AUDIT] ${entry.action} - ${entry.entityId}`, AuditService_1.name);
        // 2. Persistent Logging (S4 Protocol)
        // S4 FIX: Store encrypted PII for GDPR/S7 compliance
        try {
            const client = await this.pool.connect();
            try {
                await client.query('SET search_path TO public');
                await client.query(`INSERT INTO public.audit_logs (
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
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
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
                ]);
            }
            finally {
                try {
                    await client.query('SET search_path TO public');
                }
                catch { }
                client.release();
            }
        }
        catch (error) {
            this.logger.error('S4 CRITICAL: Audit Persistence Failure', error instanceof Error ? error.message : error);
        }
    }
    /**
     * Initialize S4 Protection
     * Ensures the audit_logs table and its immutability triggers exist
     */
    async initializeS4() {
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
            await client.query('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(created_at)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_audit_tenant ON public.audit_logs(tenant_id)');
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
        }
        finally {
            client.release();
        }
    }
};
AuditService = AuditService_1 = __decorate([
    Injectable(),
    __param(0, Inject('DATABASE_POOL')),
    __param(1, Inject(EncryptionService)),
    __metadata("design:paramtypes", [Object, EncryptionService])
], AuditService);
export { AuditService };
// --- Standalone Functions for functional usage & tests ---
// DEPRECATED/REMOVED: Standalone functions removed to force DI usage
// export async function initializeAuditTable() ...
// export async function log(entry: AuditLogEntry) ...
//# sourceMappingURL=audit.service.js.map