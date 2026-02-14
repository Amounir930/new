import { index, jsonb, pgTable, text, timestamp, uuid, } from 'drizzle-orm/pg-core';
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: text('tenant_id').notNull(), // S2: Links to tenant subdomain or ID
    userId: text('user_id'), // Nullable because system actions might not have a user
    userEmail: text('user_email'), // S4: User email for audit trail (Encrypted S7)
    action: text('action').notNull(), // e.g. 'PRODUCT_CREATED'
    entityType: text('entity_type').notNull(), // Renamed from resource for consistency
    entityId: text('entity_id').notNull(), // Renamed from resourceId
    metadata: jsonb('metadata'), // Renamed from oldValues/newValues to generic metadata
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    severity: text('severity').default('INFO'), // S4: INFO, HIGH, CRITICAL
    result: text('result').default('SUCCESS'), // S4: SUCCESS, FAILURE
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        tenantIdx: index('audit_logs_tenant_idx').on(table.tenantId),
        entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
        actionIdx: index('audit_logs_action_idx').on(table.action),
        createdIdx: index('audit_logs_created_idx').on(table.createdAt),
    };
});
//# sourceMappingURL=audit.js.map