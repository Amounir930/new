import { type InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

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

// 🔒 S15: Active Defense - RLS Policy for Tenant Registry
// This ensures that only 'active' tenants are visible by default
export const tenantsPolicy = pgPolicy('tenants_isolation', {
  for: 'select',
  to: 'public',
  using: sql`status = 'active'`,
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

export * from './schema/audit';

/**
 * S2 Compliance: Tenant-Specific Schema Tables
 * These table definitions are used to create tables inside tenant_{id} schemas
 * NEVER access these directly - always use SET search_path = tenant_{id}, public
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(), // S7: Encrypted JSON { iv, content, tag }
  emailHash: text('email_hash').notNull().unique(), // S7: Blind Index (SHA-256)
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
