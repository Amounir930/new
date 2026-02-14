/**
 * Storefront Authentication Schema
 *
 * Tables for OTP codes, auth logs, and login attempts.
 *
 * @module @apex/db/schema/storefront/auth
 */
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { customers } from './customers';
/**
 * OTP Codes Table (One-Time Passwords)
 */
export const otpCodes = pgTable('otp_codes', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, {
        onDelete: 'cascade',
    }),
    phone: varchar('phone', { length: 20 }), // For non-registered guest OTP
    code: varchar('code', { length: 10 }).notNull(),
    purpose: varchar('purpose', { length: 20 }).notNull(), // login, register, reset_password
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
/**
 * Auth Logs Table (Security Monitoring)
 */
export const authLogs = pgTable('auth_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id),
    action: varchar('action', { length: 50 }).notNull(), // login_success, login_failure, register
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    metadata: varchar('metadata', { length: 255 }), // Error messages or additional info
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
//# sourceMappingURL=auth.js.map