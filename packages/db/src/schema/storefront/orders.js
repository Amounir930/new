/**
 * Storefront Order Schema
 *
 * Orders and order items tables for templates.
 *
 * @module @apex/db/schema/storefront/orders
 */
import { char, decimal, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
import { customers } from './customers';
/**
 * Orders Table
 */
export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: varchar('order_number', { length: 20 }).notNull().unique(), // ORD-2026-XXXXX
    customerId: uuid('customer_id').references(() => customers.id), // NULL for guest
    guestEmail: varchar('guest_email', { length: 255 }), // For guest orders
    status: varchar('status', { length: 20 }).notNull(), // Enum: pending, processing, shipped, delivered, cancelled
    paymentStatus: varchar('payment_status', { length: 20 }).notNull(), // Enum: pending, paid, failed, refunded
    // Pricing
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
    shipping: decimal('shipping', { precision: 10, scale: 2 }).default('0'),
    tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 20 }), // card, cod, wallet, bnpl
    // Addresses (snapshot at order time)
    shippingAddress: jsonb('shipping_address').notNull(),
    billingAddress: jsonb('billing_address').notNull(),
    notes: text('notes'), // Customer notes
    // Tracking
    trackingNumber: varchar('tracking_number', { length: 100 }),
    trackingUrl: text('tracking_url'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
}, (table) => ({
    idxOrdersCustomer: index('idx_orders_customer').on(table.customerId),
    idxOrdersStatus: index('idx_orders_status').on(table.status),
    idxOrdersCreated: index('idx_orders_created').on(table.createdAt),
    idxOrdersNumber: index('idx_orders_number').on(table.orderNumber),
}));
/**
 * Order Items Table
 */
export const orderItems = pgTable('order_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    // Snapshot (no FK to products - data frozen at order time)
    productId: uuid('product_id'), // Reference only, not enforced
    variantId: uuid('variant_id'),
    name: varchar('name', { length: 255 }).notNull(), // Frozen product name
    sku: varchar('sku', { length: 100 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Frozen price
    quantity: integer('quantity').notNull(),
    attributes: jsonb('attributes'), // Frozen variant attributes
    imageUrl: text('image_url'),
}, (table) => ({
    idxOrderItemsOrder: index('idx_order_items_order').on(table.orderId),
}));
//# sourceMappingURL=orders.js.map