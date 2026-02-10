/**
 * Audit Logging Service
 * S4 Protocol: Immutable Audit Logs
 */
export type AuditAction = string;
export type AuditSeverity = 'INFO' | 'HIGH' | 'CRITICAL';
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
export declare function initializeAuditTable(): Promise<void>;
export declare function log(entry: AuditLogEntry): Promise<void>;
export declare function logProvisioning(storeName: string, plan: string, userId: string, ipAddress: string, success: boolean, error?: Error): Promise<void>;
export declare function logSecurityEvent(action: string, actorId: string, targetId: string, ipAddress: string, metadata?: Record<string, any>): Promise<void>;
export declare function query(options?: {
    tenantId?: string;
    action?: string;
    severity?: string;
    limit?: number;
    offset?: number;
}): Promise<AuditLogEntry[]>;
//# sourceMappingURL=audit.service.d.ts.map