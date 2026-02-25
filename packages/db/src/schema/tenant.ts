/**
 * Tenant-Isolated Schema — V5 Enterprise Hardening
 *
 * Tables created inside individual tenant schemas (tenant_{id}).
 * Alignment: Fixed (ULID, TS) -> Variable (TEXT).
 *
 * @module @apex/db/schema/tenant
 */

import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ulidId } from './v5-core';

/**
 * Tenant Users Table (Auth Logic)
 */
export const tenantUsers = pgTable('users', {
  // ── Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  // ── Scalar (S7 Encrypted) ──
  email: text('email').notNull(),
  emailHash: text('email_hash').notNull().unique(), // Blind index for lookups
  password: text('password'), // Hashed
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
});

/**
 * Tenant-Specific Stores (Sub-outlets)
 */
export const stores = pgTable('stores', {
  // ── Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  // ── Scalar ──
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull(),
  status: text('status').notNull().default('active'),
  plan: text('plan').notNull().default('free'),
});

/**
 * Tenant Runtime Settings
 */
export const settings = pgTable('settings', {
  // ── Scalar ──
  key: text('key').primaryKey(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

  // ── Variable ──
  value: text('value').notNull(),
  metadata: jsonb('metadata'),
});

/**
 * Type Exports
 */
export type TenantUser = typeof tenantUsers.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Setting = typeof settings.$inferSelect;
