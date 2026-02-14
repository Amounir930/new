/**
 * RMA (Return Merchandise Authorization) Schema
 *
 * Tables for managing product returns and refunds.
 *
 * @module @apex/db/schema/storefront/rma
 */
import { jsonb, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
import { orderItems, orders } from './orders';
/**
 * RMA Requests Table
 */
export const rmaRequests = pgTable('rma_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    // Optional: reference specific item
    orderItemId: uuid('order_item_id').references(() => orderItems.id),
    reason: varchar('reason', { length: 100 }).notNull(), // damaged, wrong_size, etc.
    description: text('description'),
    status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected, completed
    // Evidence images/videos [{ url, type }]
    evidence: jsonb('evidence').default([]),
    resolution: varchar('resolution', { length: 50 }), // refund, replacement, store_credit
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
//# sourceMappingURL=rma.js.map