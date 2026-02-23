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
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * S15: Systemic Enums for Input Validation (S3)
 */
export const tenantPlanEnum = pgEnum('tenant_plan', [
  'free',
  'basic',
  'pro',
  'enterprise',
]);
export const tenantStatusEnum = pgEnum('tenant_status', [
  'active',
  'suspended',
  'deleted',
]);
export const blueprintStatusEnum = pgEnum('blueprint_status', [
  'active',
  'paused',
]);
export const tenantNicheEnum = pgEnum('tenant_niche', [
  'retail',
  'wellness',
  'education',
  'services',
  'hospitality',
  'real-estate',
  'creative',
]);

// Note: Drizzle throws an error if pgSchema('public') is used.
// Tables defined with pgTable() go to the default 'public' schema.

/**
 * S2: Tenant Registry (Global)
 */
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subdomain: text('subdomain').notNull().unique(),
    customDomain: text('custom_domain').unique(),
    name: text('name').notNull(),
    plan: tenantPlanEnum('plan').notNull().default('free'),
    status: tenantStatusEnum('status').notNull().default('active'),
    nicheType: tenantNicheEnum('niche_type').notNull().default('retail'),
    uiConfig: jsonb('ui_config').default({}),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    isolation: pgPolicy('tenants_isolation', {
      for: 'select',
      to: 'public',
      using: sql`status = 'active'`,
    }),
  })
);

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
    plan: tenantPlanEnum('plan').notNull().default('free'),
    nicheType: tenantNicheEnum('niche_type').notNull().default('retail'),
    status: blueprintStatusEnum('status').notNull().default('active'),
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
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
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
