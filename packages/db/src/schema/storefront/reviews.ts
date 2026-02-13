/**
 * Storefront Review Schema
 *
 * Product reviews table for templates.
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
  varchar,
} from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { orders } from './orders';
import { products } from './products';

/**
 * Reviews Table
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),

    orderId: uuid('order_id').references(() => orders.id), // Verified purchase

    rating: smallint('rating').notNull(), // 1-5
    title: varchar('title', { length: 100 }),
    content: text('content').notNull(),

    isApproved: boolean('is_approved').default(false), // Moderation
    helpfulCount: integer('helpful_count').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxReviewsProduct: index('idx_reviews_product').on(table.productId),
    idxReviewsApproved: index('idx_reviews_approved')
      .on(table.isApproved)
      // 🔒 S11: Safe partial index. Isolation verified via S2 search_path.
      .where(sql`is_approved = true`),
    idxReviewsCustomer: index('idx_reviews_customer').on(table.customerId),
  })
);

// Type exports
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
