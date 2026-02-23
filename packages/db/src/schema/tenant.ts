/**
 * Tenant-Specific Schema Tables
 * These tables are created INSIDE each tenant_{subdomain} schema
 * Used by: Per-tenant data isolation (users, stores, products, etc)
 */

import type { InferSelectModel } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * S2: Tenant-Isolated Users
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(), // S7: Encrypted JSON
  emailHash: text('email_hash').notNull().unique(), // S7: Blind Index
  password: text('password'), // S7: Hashed password (Bcrypt)
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = InferSelectModel<typeof users>;

/**
 * S2: Tenant-Isolated Stores
 */
export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull(),
  status: text('status').notNull().default('active'),
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * S2: Tenant-Isolated Settings
 */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Note: Storefront tables (products, categories, pages, etc) are imported via @apex/db/schema/storefront
// and should not be exported from here to avoid naming conflicts like 'pages'.
