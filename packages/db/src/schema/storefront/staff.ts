/**
 * Staff RBAC + Sessions Schema — V5
 *
 * Roles, staff members, and secure sessions with device fingerprinting.
 *
 * @module @apex/db/schema/storefront/staff
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { governanceUsers } from '../governance.js';
import { deletedAt, storefrontSchema, ulidId } from '../v5-core';

// ─── Staff Roles ─────────────────────────────────────────────
/**
 * Staff Roles (RBAC)
 * ALIGNMENT: UUID -> TS -> BOOL -> TEXT -> JSONB
 */
export const staffRoles = storefrontSchema.table(
  'staff_roles',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Boolean ──
    isSystem: boolean('is_system').default(false).notNull(),

    // ── 3. Scalar ──
    name: text('name').notNull(),
    description: text('description'),

    // Structural validation MUST be enforced at the API layer via @apex/security (Zod).
    permissions: jsonb('permissions').notNull().default({}),
  },
  (table) => ({
    // Mandate #13: Structural DB-level validation for Staff JSONB schema.
    // Mandate #5 (Red Team): Exactly specified top-level keys. No 'is_super_admin' injection allowed.
    permissionsCheck: check(
      'permissions_strict_keys',
      sql`
      jsonb_typeof(${table.permissions}) = 'object' 
      AND NOT EXISTS (
        SELECT 1 
        FROM jsonb_object_keys(${table.permissions}) AS k 
        WHERE k NOT IN ('products', 'orders', 'customers', 'settings', 'promotions', 'analytics')
      )
    `
    ),
  })
);

// ─── Staff Members ───────────────────────────────────────────
export const staffMembers = storefrontSchema.table(
  'staff_members',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    // Point #17: cross-service/external reference strategy via logical validation.
    userId: uuid('user_id').notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => staffRoles.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp('last_login_at', {
      withTimezone: true,
      precision: 6,
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, precision: 6 }),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar (S7 Encrypted PII) ──
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),
    phone: text('phone'),
  },
  (table) => ({
    idxStaffUser: index('idx_staff_user').on(table.userId),
    idxStaffActive: index('idx_staff_active')
      .on(table.isActive)
      .where(sql`deleted_at IS NULL`),
  })
);

// ─── Staff Sessions (Secure) ────────────────────────────────
export const staffSessions = storefrontSchema.table(
  'staff_sessions',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staffMembers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      precision: 6,
    }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, precision: 6 }),

    // ── Scalar ──
    tokenHash: text('token_hash').notNull(),
    deviceFingerprint: text('device_fingerprint'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => ({
    idxSessionToken: index('idx_session_token').on(table.tokenHash),
    // Directive #20: Fast session revocation lookup.
    idxSessionDevice: index('idx_session_revocation_lookup').on(
      table.staffId,
      table.deviceFingerprint,
      table.revokedAt
    ),
    idxSessionActive: index('idx_session_active')
      .on(table.staffId)
      .where(sql`revoked_at IS NULL`),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type StaffRole = typeof staffRoles.$inferSelect;
export type StaffMember = typeof staffMembers.$inferSelect;
export type StaffSession = typeof staffSessions.$inferSelect;
