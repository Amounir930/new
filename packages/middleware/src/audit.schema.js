/**
 * Audit Schema - Zod Validation (Rule 5.1)
 * S4 Protocol: Audit Logging
 */
import { z } from 'zod';
/**
 * Audit log entry schema
 */
export const AuditLogSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string().uuid(),
    userEmail: z.string().email(),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT']),
    entityType: z.string(),
    entityId: z.string(),
    metadata: z.record(z.unknown()).optional(),
    ipAddress: z.string().ip(),
    userAgent: z.string(),
    timestamp: z.string().datetime(),
});
/**
 * Create audit log entry schema
 */
export const CreateAuditLogSchema = z.object({
    tenantId: z.string().uuid(),
    userId: z.string().uuid(),
    userEmail: z.string().email(),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT']),
    entityType: z.string(),
    entityId: z.string(),
    metadata: z.record(z.unknown()).optional(),
    ipAddress: z.string().ip(),
    userAgent: z.string(),
});
//# sourceMappingURL=audit.schema.js.map