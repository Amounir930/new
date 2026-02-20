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
export const onboardingBlueprints = pgTable(
  'onboarding_blueprints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    blueprint: jsonb('blueprint').notNull(),
    isDefault: pgBoolean('is_default').notNull().default(false),
    plan: text('plan').notNull().default('free'), // S21: free, basic, pro, enterprise
    nicheType: text('niche_type').notNull(), // S21: retail, wellness, etc.
    status: text('status').notNull().default('active'), // S21: active, paused
    uiConfig: jsonb('ui_config').default({}),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nichePlanIdx: index('blueprint_niche_plan_idx').on(
      table.nicheType,
      table.plan
    ),
  })
);


/**
 * S2: Tenant Migration Tracking
 * Tracks which DB migrations have been applied per tenant schema.
 * Critical for managing schema evolution across millions of tenant stores.
 */
export const tenantMigrations = pgTable(
  'tenant_migrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: text('tenant_id').notNull(),
    migrationName: text('migration_name').notNull(),
    appliedAt: timestamp('applied_at').defaultNow().notNull(),
    status: text('status').notNull().default('success'), // success | failed | pending
    errorMessage: text('error_message'),
  },
  (table) => ({
    tenantMigIdx: index('tenant_migrations_tenant_idx').on(table.tenantId),
  })
);

export type TenantMigration = InferSelectModel<typeof tenantMigrations>;
