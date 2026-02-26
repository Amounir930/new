/**
 * Storefront Review Schema — V5
 *
 * Product reviews with moderation.
 * FK: RESTRICT on products (preserve review history).
 *
 * @module @apex/db/schema/storefront/reviews
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';
import { customers } from './customers';
import { orders } from './orders';
import { products } from './products';

/**
 * Reviews Table
 * Column alignment: UUID → TIMESTAMPTZ → INT → BOOLEAN → TEXT
 */
export const reviews = storefrontSchema.table(
  'reviews',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    orderId: uuid('order_id').references(() => orders.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Integer ──
    rating: smallint('rating').notNull(),
    helpfulCount: integer('helpful_count').default(0),

    // ── Boolean ──
    isApproved: boolean('is_approved').default(false),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false),

    // ── Scalar ──
    title: text('title'),
    content: text('content').notNull(),
  },
  (table) => ({
    idxReviewsProduct: index('idx_reviews_product').on(table.productId),
    idxReviewsApproved: index('idx_reviews_approved')
      .on(table.isApproved)
      .where(sql`is_approved = true`),
    idxReviewsCustomer: index('idx_reviews_customer').on(table.customerId),
  })
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
