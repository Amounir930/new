import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { AuditSeverity } from './audit.service';

/**
 * Metadata key for audit logging
 */
export const AUDIT_LOG_METADATA_KEY = 'audit_log_action';

/**
 * Interface for AuditLog decorator options
 */
export interface AuditLogOptions {
  action: string;
  entityType?: string;
  severity?: AuditSeverity;
}

/**
 * S4: AuditLog Decorator
 * Marks a method for automatic or manual audit scanning
 * Usage: @AuditLog({ action: 'USER_LOGIN', entityType: 'auth' })
 */
export function AuditLog(options: AuditLogOptions | string) {
  const finalOptions =
    typeof options === 'string' ? { action: options } : options;
  return applyDecorators(SetMetadata(AUDIT_LOG_METADATA_KEY, finalOptions));
}
