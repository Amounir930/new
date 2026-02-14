/**
 * Metadata key for audit logging
 */
export declare const AUDIT_LOG_METADATA_KEY = "audit_log_action";
/**
 * Interface for AuditLog decorator options
 */
export interface AuditLogOptions {
    action: string;
    entityType?: string;
    severity?: 'INFO' | 'HIGH' | 'CRITICAL';
}
/**
 * S4: AuditLog Decorator
 * Marks a method for automatic or manual audit scanning
 * Usage: @AuditLog({ action: 'USER_LOGIN', entityType: 'auth' })
 */
export declare function AuditLog(options: AuditLogOptions | string): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
//# sourceMappingURL=audit.decorator.d.ts.map