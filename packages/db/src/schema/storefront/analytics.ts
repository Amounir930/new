/**
 * Storefront Analytics & CDP Schema — V5 Enterprise Hardening
 *
 * Tables: product_views, abandoned_checkouts, customer_segments.
 * Logic: CDP Data Capture + BRIN Indexes.
 */

import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { moneyAmount, ulidId } from '../v5-core';
import { customers } from './customers';
import { productVariants } from './products';

/**
 * 👁️ Product Views (Behavioral Tracking)
 */
export const productViews = pgTable(
  'product_views',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id),
    customerId: uuid('customer_id').references(() => customers.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // ── 2. Text ──
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => ({
    idxViewCreatedBrin: index('idx_view_created_brin').using(
      'brin',
      table.createdAt
    ),
  })
);

/**
 * 🛒 Abandoned Checkouts (Recovery Pipeline)
 */
export const abandonedCheckouts = pgTable('abandoned_checkouts', {
  // ── 1. Fixed ──
  id: ulidId(),
  customerId: uuid('customer_id').references(() => customers.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  abandonedAt: timestamp('abandoned_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. Money ──
  subtotalPrice: moneyAmount('subtotal_price'),
  totalPrice: moneyAmount('total_price'),

  // ── 3. Text ──
  recoveryHash: text('recovery_hash').unique(),
  email: text('email'),

  // ── 4. JSONB ──
  cartData: jsonb('cart_data').notNull(),
});

/**
 * 👥 Customer Segments (CDP)
 */
export const customerSegments = pgTable('customer_segments', {
  // ── 1. Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. Scalar ──
  name: text('name').notNull(),
  query: text('query').notNull(), // SQL or DSL query for the segment
});

// Type Exports
export type ProductView = typeof productViews.$inferSelect;
export type AbandonedCheckout = typeof abandonedCheckouts.$inferSelect;
export type CustomerSegment = typeof customerSegments.$inferSelect;
