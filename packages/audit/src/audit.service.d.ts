/**
 * Audit Logging Service
 * S4 Protocol: Immutable Audit Logs
 */
import { EncryptionService } from '@apex/security';
export type AuditAction = string;
export type AuditSeverity = 'INFO' | 'HIGH' | 'CRITICAL';
export declare const SecurityEvents: {
    readonly TENANT_PROVISIONED: "TENANT_PROVISIONED";
    readonly HONEYPOT_HIT: "HONEYPOT_HIT";
    readonly SQL_INJECTION_ATTEMPT: "SQL_INJECTION_ATTEMPT";
    readonly KEY_ROTATION: "KEY_ROTATION";
};
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
    userEmail?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: Date;
    severity?: AuditSeverity;
    result?: string;
    status?: string;
    errorMessage?: string;
}
export declare class AuditService {
    private readonly logger;
    private encryption;
    private pool;
    constructor(pool: any, encryption?: EncryptionService);
    /**
     * Log a security or system event
     * S4: This logs to an immutable table in the public schema
     * @param entry - Audit log data
     */
    log(entry: AuditLogEntry): Promise<void>;
    /**
     * Initialize S4 Protection
     * Ensures the audit_logs table and its immutability triggers exist
     */
    initializeS4(): Promise<void>;
}
//# sourceMappingURL=audit.service.d.ts.map