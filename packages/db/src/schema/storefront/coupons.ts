/**
 * Storefront Coupon Schema — V5 Enterprise Hardening
 *
 * Legacy/Simple discount coupons.
 *
 * @module @apex/db/schema/storefront/coupons
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { moneyAmount, storefrontSchema, ulidId } from '../v5-core';

/**
 * Coupons Table
 * Alignment Rule: UUID -> TIMESTAMPTZ -> MONEY -> INTEGER -> BOOLEAN -> TEXT
 */
export const coupons = storefrontSchema.table(
  'coupons',
  {
    // ── Fixed (Alignment Tier 1) ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // ── Money (Alignment Tier 2) ──
    value: moneyAmount('value').notNull(),
    minOrderAmount: moneyAmount('min_order_amount'),

    // ── Integer (Alignment Tier 3) ──
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').default(0),
    maxUsesPerCustomer: integer('max_uses_per_customer'),

    // ── Boolean (Alignment Tier 4) ──
    isActive: boolean('is_active').default(true),

    // ── Scalar (Alignment Tier 5) ──
    code: text('code').notNull().unique(),
    type: text('type').notNull(), // percentage, fixed
  },
  (table) => ({
    idxCouponsCode: index('idx_coupons_code').on(table.code),
    idxCouponsActive: index('idx_coupons_active').on(table.isActive),

    // Risk #15: Case-Sensitivity Double-Dip (Neural Enforcement)
    codeUpperCheck: check(
      'coupon_code_upper_check',
      sql`${table.code} = UPPER(${table.code})`
    ),

    // Risk #18: Promo Exhaustion Race Condition (Engine Defense)
    usageExhaustionCheck: check(
      'coupon_usage_exhaustion_check',
      sql`${table.usedCount} <= ${table.maxUses}`
    ),
  })
);

export type Coupon = typeof coupons.$inferSelect;
