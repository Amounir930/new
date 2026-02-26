/**
 * Tenant-Isolated Schema — V5 Enterprise Hardening
 *
 * Tables created inside individual tenant schemas (tenant_{id}).
 * Alignment: Fixed (ULID, TS) -> Variable (TEXT).
 *
 * @module @apex/db/schema/tenant
 */

import { sql } from 'drizzle-orm';
import { check, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { encryptedCheck, encryptedText, ulidId } from './v5-core';

/**
 * Tenant Users Table (Auth Logic)
 *
 * S7: email is stored as AES-256-GCM ciphertext envelope.
 * DB enforces this with encryptedCheck — plaintext is physically rejected.
 */
export const tenantUsers = pgTable(
  'users',
  {
    // ── Fixed ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Scalar (S7 Encrypted — DB-enforced) ──
    // C-1 Fix: Changed from text() to encryptedText(). DB CHECK prevents plaintext storage.
    email: encryptedText('email').notNull(),
    emailHash: text('email_hash').notNull().unique(), // Blind index for lookups
    password: text('password'), // Hashed via bcrypt — not PII, no encryption needed
    role: text('role').notNull().default('user'),
    status: text('status').notNull().default('active'),
  },
  (table) => ({
    // C-1 Fix: Enforce S7 ciphertext structure at DB level.
    emailEncrypted: encryptedCheck(table.email),
    // Order 2 Fix: Direct redundant check for absolute certainty in PII protection.
    emailProtocolCheck: check(
      'email_pii_envelope_check',
      sql`(${table.email}::jsonb) ? 'data'`
    ),
  })
);

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
