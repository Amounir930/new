/**
 * Storefront Discounts Schema — V5 Enterprise Hardening
 *
 * Tables: price_rules, discount_codes.
 * Logic: JSONB Stackable rules + BigInt Precision.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { moneyAmount, storefrontSchema, ulidId } from '../v5-core';

export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed_amount',
  'shipping',
  'buy_x_get_y',
]);

/**
 * 🏷️ Price Rules (Logic Layer)
 */
export const priceRules = storefrontSchema.table(
  'price_rules',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    startsAt: timestamp('starts_at', {
      withTimezone: true,
      precision: 6,
    }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, precision: 6 }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. BigInt / Money ──
    minPurchaseAmount: moneyAmount('min_purchase_amount'),
    valueAmount: moneyAmount('value_amount'),

    // ── 3. Integer ──
    valuePercentage: integer('value_percentage'),
    usageLimit: integer('usage_limit'),
    usageCount: integer('usage_count').default(0).notNull(),

    // ── 4. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),

    // ── 5. Enum ──
    type: discountTypeEnum('type').notNull(),

    // ── 6. Scalar ──
    title: text('title').notNull(),

    // ── 7. JSONB (Variable) ──
    combinesWith: jsonb('combines_with').default({}), // Point #11: stacking logic
    entitledProductIds: jsonb('entitled_product_ids').default([]),
    prerequisiteCustomerIds: jsonb('prerequisite_customer_ids').default([]),
  },
  (table) => ({
    usageLimitCheck: check(
      'usage_limit_check',
      sql`${table.usageCount} <= ${table.usageLimit}`
    ),
  })
);

/**
 * 🎫 Discount Codes (UI Layer)
 */
export const discountCodes = storefrontSchema.table(
  'discount_codes',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    priceRuleId: uuid('price_rule_id')
      .notNull()
      .references(() => priceRules.id),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Integer ──
    usageCount: integer('usage_count').default(0).notNull(),

    // ── 3. Scalar ──
    // Directive #15: Enforce UPPER case for coupons via check constraint.
    code: text('code').notNull(),
  },
  (table) => ({
    // Directive #15: Case-insensitive coupon uniqueness.
    idxDiscountCodeUnique: uniqueIndex('idx_discount_code_active')
      .on(table.tenantId, sql`UPPER(${table.code})`)
      .where(sql`deleted_at IS NULL`),
    codeUpperCheck: check(
      'code_upper_check',
      sql`${table.code} = UPPER(${table.code})`
    ),
  })
);

// Type Exports
export type PriceRule = typeof priceRules.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
