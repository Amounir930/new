/**
 * Product Notices Schema — V5
 *
 * Tables for "Back in Stock" and general product-related alerts.
 *
 * @module @apex/db/schema/storefront/product-notices
 */

import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { ulidId } from '../v5-core';
import { customers } from './customers';
import { products } from './products';

/**
 * Back in Stock Requests
 * Column alignment: UUID → TIMESTAMPTZ → BOOLEAN → TEXT
 */
export const backInStockRequests = pgTable(
  'back_in_stock_requests',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),

    // ── Boolean ──
    isNotified: boolean('is_notified').default(false),

    // ── Scalar ──
    email: text('email').notNull(),
  },
  (table) => ({
    idxBackInStockProduct: index('idx_bis_product').on(table.productId),
    idxBackInStockCustomer: index('idx_bis_customer').on(table.customerId),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type BackInStockRequest = typeof backInStockRequests.$inferSelect;
export type NewBackInStockRequest = typeof backInStockRequests.$inferInsert;
