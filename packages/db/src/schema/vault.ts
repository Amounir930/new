/**
 * Security Vault Schema — V5 Enterprise Hardening
 *
 * Tables: encryption_keys.
 * Security: BYTEA Binary Integrity + Versioning.
 */

import {
  boolean,
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { bytea, ulidId } from './v5-core';

export const vaultSchema = pgSchema('vault');

/**
 * 🔑 Encryption Keys (Root Trust)
 * Point #14: BYTEA for binary safety.
 * ALIGNMENT: UUID -> TS -> INT -> BOOL -> TEXT -> BYTEA
 */
export const encryptionKeys = vaultSchema.table('encryption_keys', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id').notNull().unique(), // references tenants.id
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  rotatedAt: timestamp('rotated_at', { withTimezone: true }),

  // ── 2. Integer ──
  version: integer('version').default(1).notNull(),

  // ── 3. Boolean ──
  isActive: boolean('is_active').default(true).notNull(),

  // ── 4. Text (Algorithm / Metadata) ──
  algorithm: text('algorithm').default('AES-256-GCM').notNull(),

  // ── 5. Binary (Point #14) ──
  encryptedKey: bytea('encrypted_key').notNull(),
});

// Type Exports
export type EncryptionKey = typeof encryptionKeys.$inferSelect;
