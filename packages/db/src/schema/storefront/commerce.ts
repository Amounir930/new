/**
 * Storefront Markets Schema — V5 Enterprise Hardening
 *
 * Tables: markets, price_lists, currency_rates.
 * Commerce: Cross-Border Trade & Localization.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { deletedAt, moneyAmount, storefrontSchema, ulidId } from '../v5-core';

/**
 * 🌍 Global Markets
 */
export const commerceMarkets = storefrontSchema.table(
  'commerce_markets',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // ── 2. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),

    // ── 3. Scalar ──
    name: text('name').notNull(),
    code: text('code').notNull(), // sa, ae, us
    currencyCode: text('currency_code').notNull().default('SAR'),
    languageCode: text('language_code').notNull().default('ar'),
    deletedAt: deletedAt(),
  },
  (table) => ({
    idxMarketCodeUnique: uniqueIndex('idx_market_code_unique')
      .on(table.tenantId, table.code)
      .where(sql`deleted_at IS NULL`),
  })
);

/**
 * 💰 Price Lists (Market-Specific Pricing)
 */
export const priceLists = storefrontSchema.table(
  'price_lists',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // ── 2. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),

    // ── 3. Scalar ──
    name: text('name').notNull(),
    description: text('description'),
    marketId: uuid('market_id')
      .notNull()
      .references(() => commerceMarkets.id),
    currency: text('currency').notNull().default('SAR'),
  },
  (_table) => ({
    // Mandate #17: Database constraint ensuring PriceList currency matches Market currency.
    // Enforced via trigger in 0007_advanced_constraints.sql
  })
);

/**
 * 💱 Currency Rates
 */
export const currencyRates = storefrontSchema.table('currency_rates', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. BigInt (Rate in 6 decimal places = bigint * 1,000,000) ──
  rate: moneyAmount('rate').notNull(),

  // ── 3. Scalar ──
  sourceCurrency: text('source_currency').notNull().default('USD'),
  targetCurrency: text('target_currency').notNull(),
});

// Type Exports
export type CommerceMarket = typeof commerceMarkets.$inferSelect;
export type PriceList = typeof priceLists.$inferSelect;
export type CurrencyRate = typeof currencyRates.$inferSelect;
