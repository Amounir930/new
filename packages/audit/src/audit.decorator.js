import { SetMetadata, applyDecorators } from '@nestjs/common';
/**
 * Metadata key for audit logging
 */
export const AUDIT_LOG_METADATA_KEY = 'audit_log_action';
/**
 * S4: AuditLog Decorator
 * Marks a method for automatic or manual audit scanning
 * Usage: @AuditLog({ action: 'USER_LOGIN', entityType: 'auth' })
 */
export function AuditLog(options) {
    const finalOptions = typeof options === 'string' ? { action: options } : options;
    return applyDecorators(SetMetadata(AUDIT_LOG_METADATA_KEY, finalOptions));
}
//# sourceMappingURL=audit.decorator.js.map