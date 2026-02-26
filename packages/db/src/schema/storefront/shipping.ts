/**
 * Storefront Shipping Schema — V5 Enterprise Hardening
 *
 * Tables: Shipping Zones, Methods, Rates.
 * Spatial Intelligence: PostGIS Geography for zone boundaries.
 *
 * @module @apex/db/schema/storefront/shipping
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  geographyPoint,
  moneyAmount,
  storefrontSchema,
  ulidId,
} from '../v5-core';

/**
 * Shipping Zones
 * Decision #11: PostGIS Geography for spatial boundaries.
 */
export const shippingZones = storefrontSchema.table('shipping_zones', {
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
  countryCode: text('country_code').notNull(), // ISO 3166-1

  // ── 4. Geographic ──
  centerPoint: geographyPoint('center_point'),

  // ── 5. JSONB ──
  regions: jsonb('regions'), // ["US-NY", "US-NJ"]
});

/**
 * Shipping Methods & Rates
 */
export const shippingMethods = storefrontSchema.table('shipping_methods', {
  // ── 1. Fixed ──
  id: ulidId(),
  zoneId: uuid('zone_id')
    .notNull()
    .references(() => shippingZones.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. Money ──
  basePrice: moneyAmount('base_price').notNull(),
  minOrderTotal: moneyAmount('min_order_total'),

  // ── 3. Integer ──
  minWeightGrams: integer('min_weight_grams'),
  maxWeightGrams: integer('max_weight_grams'),

  // ── 4. Boolean ──
  isActive: boolean('is_active').default(true).notNull(),

  // ── 5. Scalar ──
  name: text('name').notNull(),
  provider: text('provider'), // Aramex, DHL, Local
  estimatedDays: text('estimated_days'),
});

/**
 * Tax Categories & Rates
 */
export const taxCategories = storefrontSchema.table(
  'tax_categories',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // ── 2. Integer (Decision #7: Priority) ──
    priority: integer('priority').default(0).notNull(),
    rateBasisPoints: integer('rate_basis_points').notNull(), // 1500 = 15.00%

    // ── 3. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),
    isCompound: boolean('is_compound').default(false).notNull(),

    // ── 4. Scalar ──
    name: text('name').notNull(),
    code: text('code').notNull().unique(), // VAT, GST
  },
  (table) => ({
    idxTaxPriorityUnique: uniqueIndex('idx_tax_priority_unique').on(
      table.priority,
      table.code
    ), // Assuming code/region context
  })
);

// Type Exports
export type ShippingZone = typeof shippingZones.$inferSelect;
export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type TaxCategory = typeof taxCategories.$inferSelect;
