/**
 * Loyalty System Schema — V5
 *
 * Tables for loyalty rules and points management.
 *
 * @module @apex/db/schema/storefront/loyalty
 */

import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';

/**
 * Loyalty Rules Table
 */
export const loyaltyRules = storefrontSchema.table('loyalty_rules', {
  // ── Fixed (Alignment) ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

  // ── Integer ──
  pointsPerCurrency: integer('points_per_currency').default(1),
  minRedeemPoints: integer('min_redeem_points').default(100),
  pointsExpiryDays: integer('points_expiry_days'), // NULL = never

  // ── Boolean (Decision #2.1: Unified Booleans) ──
  isActive: boolean('is_active').default(true),

  // ── Scalar ──
  name: text('name').notNull(),

  // ── JSONB (Decision #5: i18n/Metadata) ──
  rewards: jsonb('rewards').default([]),
});

/**
 * Type Exports
 */
export type LoyaltyRule = typeof loyaltyRules.$inferSelect;
export type NewLoyaltyRule = typeof loyaltyRules.$inferInsert;
