/**
 * Storefront Authentication Schema — V5 Enterprise Hardening
 *
 * Tables for OTP codes, auth logs, and login attempts.
 *
 * @module @apex/db/schema/storefront/auth
 */

import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ulidId } from '../v5-core';
import { customers } from './customers';

/**
 * OTP Codes Table (One-Time Passwords)
 * Alignment: UUID -> TIMESTAMPTZ -> TEXT
 */
export const otpCodes = pgTable('otp_codes', {
  // ── Fixed (Alignment Tier 1) ──
  id: ulidId(),
  customerId: uuid('customer_id').references(() => customers.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),

  // ── Scalar (Alignment Tier 2) ──
  phone: text('phone'),
  code: text('code').notNull(),
  purpose: text('purpose').notNull(), // login, register, reset_password
});

/**
 * Auth Logs Table (Security Monitoring)
 * Alignment: UUID -> TIMESTAMPTZ -> TEXT
 */
export const authLogs = pgTable(
  'auth_logs',
  {
    // ── Fixed ──
    id: ulidId(),
    customerId: uuid('customer_id').references(() => customers.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Scalar ──
    action: text('action').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: text('metadata'),
  },
  (table) => ({
    idxAuthLogsCustomer: index('idx_auth_logs_customer').on(table.customerId),
    idxAuthLogsCreated: index('idx_auth_logs_created').on(table.createdAt),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type OtpCode = typeof otpCodes.$inferSelect;
export type AuthLog = typeof authLogs.$inferSelect;
