/**
 * Storefront Wishlist Schema
 *
 * Customer wishlists table for templates.
 *
 * @module @apex/db/schema/storefront/wishlists
 */
import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { products } from './products';
/**
 * Wishlists Table (many-to-many)
 */
export const wishlists = pgTable('wishlists', {
    customerId: uuid('customer_id')
        .notNull()
        .references(() => customers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
        .notNull()
        .references(() => products.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    pk: unique().on(table.customerId, table.productId),
}));
//# sourceMappingURL=wishlists.js.map