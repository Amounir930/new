/**
 * Audit Schema - Zod Validation (Rule 5.1)
 * S4 Protocol: Audit Logging
 */
import { z } from 'zod';
/**
 * Audit log entry schema
 */
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    userEmail: z.ZodString;
    action: z.ZodEnum<["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT"]>;
    entityType: z.ZodString;
    entityId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ipAddress: z.ZodString;
    userAgent: z.ZodString;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    userId: string;
    userEmail: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
    entityType: string;
    entityId: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    tenantId: string;
    userId: string;
    userEmail: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
    entityType: string;
    entityId: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    metadata?: Record<string, unknown> | undefined;
}>;
export type AuditLogDto = z.infer<typeof AuditLogSchema>;
/**
 * Create audit log entry schema
 */
export declare const CreateAuditLogSchema: z.ZodObject<{
    tenantId: z.ZodString;
    userId: z.ZodString;
    userEmail: z.ZodString;
    action: z.ZodEnum<["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT"]>;
    entityType: z.ZodString;
    entityId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ipAddress: z.ZodString;
    userAgent: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    userId: string;
    userEmail: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
    entityType: string;
    entityId: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, unknown> | undefined;
}, {
    tenantId: string;
    userId: string;
    userEmail: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
    entityType: string;
    entityId: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, unknown> | undefined;
}>;
export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;
//# sourceMappingURL=audit.schema.d.ts.map