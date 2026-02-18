/**
 * Public Schema Tables
 * These tables exist ONLY in the public schema for global system management
 * Used by: System-wide operations, tenant registry, audit logging
 */

import { type InferSelectModel, sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  boolean as pgBoolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Note: Drizzle throws an error if pgSchema('public') is used.
// Tables defined with pgTable() go to the default 'public' schema.

/**
 * S2: Tenant Registry (Global)
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  subdomain: text('subdomain').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  nicheType: text('niche_type'),
  uiConfig: jsonb('ui_config').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tenantsPolicy = pgPolicy('tenants_isolation', {
  for: 'select',
  to: 'public',
  using: sql`status = 'active'`,
});

export type Tenant = InferSelectModel<typeof tenants>;

/**
 * Super-#21: Onboarding Blueprint Editor
 */
export const onboardingBlueprints = pgTable('onboarding_blueprints', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  blueprint: jsonb('blueprint').notNull(),
  isDefault: pgBoolean('is_default').notNull().default(false),
  plan: text('plan').notNull().default('free'),
  nicheType: text('niche_type'),
  uiConfig: jsonb('ui_config').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * S4: Audit Logs (Immutable, Global)
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: text('tenant_id').notNull(),
    userId: text('user_id'),
    userEmail: text('user_email'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    severity: text('severity').default('INFO'),
    result: text('result').default('SUCCESS'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('audit_logs_tenant_idx').on(table.tenantId),
    entityIdx: index('audit_logs_entity_idx').on(
      table.entityType,
      table.entityId
    ),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdIdx: index('audit_logs_created_idx').on(table.createdAt),
  })
);

export type AuditLog = InferSelectModel<typeof auditLogs>;
