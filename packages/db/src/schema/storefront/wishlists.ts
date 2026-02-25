/**
 * Storefront Wishlist Schema — V5
 *
 * Customer wishlists table for templates.
 *
 * @module @apex/db/schema/storefront/wishlists
 */

import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { products } from './products';

/**
 * Wishlists Table
 * Column alignment: UUID → TIMESTAMPTZ
 */
export const wishlists = pgTable(
  'wishlists',
  {
    // ── Fixed (Alignment) ──
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: unique().on(table.customerId, table.productId),
    idxWishlistCustomer: index('idx_wishlist_customer').on(table.customerId),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
