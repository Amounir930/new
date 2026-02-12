/**
 * Size Guides Schema
 * 
 * Tables for product sizing information and interactive guides.
 * 
 * @module @apex/db/schema/storefront/size-guides
 */

import {
    jsonb,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { products } from './products';
import { categories } from './categories';

/**
 * Size Guides Table
 */
export const sizeGuides = pgTable(
    'size_guides',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),

        // Optional links to specific category or product
        categoryId: uuid('category_id').references(() => categories.id),
        productId: uuid('product_id').references(() => products.id),

        // The actual table data [{ size: 'S', chest: '36"', length: '28"' }]
        tableData: jsonb('table_data').notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    }
);

/**
 * Type Exports
 */
export type SizeGuide = typeof sizeGuides.$inferSelect;
export type NewSizeGuide = typeof sizeGuides.$inferInsert;
