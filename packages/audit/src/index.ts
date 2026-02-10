export {
  AUDIT_LOG_METADATA_KEY,
  AuditLog,
  type AuditLogOptions,
} from './audit.decorator.js';
export {
  type AuditAction,
  type AuditLogEntry,
  type AuditQueryOptions,
  AuditService, // Added missing export
  type AuditSeverity,
  initializeAuditTable,
  log,
  logProvisioning,
  logSecurityEvent,
  query,
} from './audit.service.js';
