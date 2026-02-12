/**
 * Product Notices Schema
 *
 * Tables for "Back in Stock" and general product-related alerts.
 *
 * @module @apex/db/schema/storefront/product-notices
 */

import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { products } from './products';

/**
 * Back in Stock Requests
 */
export const backInStockRequests = pgTable('back_in_stock_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, {
    onDelete: 'cascade',
  }),
  customerId: uuid('customer_id').references(() => customers.id),

  email: varchar('email', { length: 255 }).notNull(), // Unified for guest/logged-in

  isNotified: boolean('is_notified').default(false),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Type Exports
 */
export type BackInStockRequest = typeof backInStockRequests.$inferSelect;
export type NewBackInStockRequest = typeof backInStockRequests.$inferInsert;
