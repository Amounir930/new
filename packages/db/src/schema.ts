import type { InferSelectModel } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * S2 Compliance: Public Schema Tables (Tenant Management)
 * These tables exist ONLY in the public schema for tenant registry
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  subdomain: text('subdomain').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Tenant = InferSelectModel<typeof tenants>;

// Governance & Quotas
export * from './schema/governance';

/**
 * Super-#21: Onboarding Blueprint Editor
 * Stores JSON templates for tenant provisioning
 */
export const onboardingBlueprints = pgTable('onboarding_blueprints', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // Blueprint JSON schema - defines starter data for new tenants
  blueprint: text('blueprint').notNull(), // JSON string
  isDefault: text('is_default').notNull().default('false'),
  plan: text('plan').notNull().default('free'), // Which plan this blueprint applies to
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id'),
  userEmail: text('user_email'), // S4: User email for audit trail
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: text('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  severity: text('severity').default('INFO'), // S4: Audit severity level
  result: text('result').default('SUCCESS'), // S4: Operation result
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * S2 Compliance: Tenant-Specific Schema Tables
 * These table definitions are used to create tables inside tenant_{id} schemas
 * NEVER access these directly - always use SET search_path = tenant_{id}, public
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull(),
  status: text('status').notNull().default('active'),
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  content: text('content').default(''),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * S2 Compliance Helper: Generate schema-qualified table name
 * Usage: const tableName = getTenantTableName('users', subdomain);
 */

export function getTenantTableName(
  tableName: string,
  subdomain: string
): string {
  const schema = `tenant_${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return `"${schema}"."${tableName}"`;
}

/**
 * S2 Compliance Helper: SQL for setting search path
 * Usage: await db.execute(setTenantSearchPath(subdomain));
 */
export function setTenantSearchPath(subdomain: string): string {
  const schema = `tenant_${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return `SET search_path TO "${schema}", public`;
}
