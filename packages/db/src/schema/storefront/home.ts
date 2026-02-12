/**
 * Home Page Extended Configuration & Marketing Schema
 * 
 * Tables for Flash Sales, Bento Grids, and Sectional marketing.
 * 
 * @module @apex/db/schema/storefront/home
 */

import {
    integer,
    jsonb,
    pgTable,
    timestamp,
    uuid,
    varchar,
    decimal,
    index,
} from 'drizzle-orm/pg-core';
import { products } from './products';

/**
 * Flash Sales Campaigns
 */
export const flashSales = pgTable(
    'flash_sales',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: varchar('name', { length: 110 }).notNull(),
        endTime: timestamp('end_time', { withTimezone: true }).notNull(),
        status: varchar('status', { length: 20 }).default('active'), // active, paused, expired

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        idxFlashSalesStatus: index('idx_flash_sales_status').on(table.status),
        idxFlashSalesEndTime: index('idx_flash_sales_end_time').on(table.endTime),
    })
);

/**
 * Flash Sale Products (Junction Table)
 */
export const flashSaleProducts = pgTable(
    'flash_sale_products',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        flashSaleId: uuid('flash_sale_id').references(() => flashSales.id, { onDelete: 'cascade' }),
        productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),

        discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).notNull(),
        quantityLimit: integer('quantity_limit').notNull(),
        soldQuantity: integer('sold_quantity').default(0),

        order: integer('order').default(0),
    },
    (table) => ({
        idxFlashSaleProdCampaign: index('idx_fs_prod_campaign').on(table.flashSaleId),
        idxFlashSaleProdProduct: index('idx_fs_prod_product').on(table.productId),
    })
);

/**
 * Bento Grid Configurations
 */
export const bentoGrids = pgTable('bento_grids', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    layoutId: varchar('layout_id', { length: 50 }).notNull(), // '3-card', '5-card', etc.

    // Slots stores the mapping: [{ slotId, type, referenceId, customImage, customText }]
    slots: jsonb('slots').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Search Analytics Table
 */
export const searchAnalytics = pgTable(
    'search_analytics',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        query: varchar('query', { length: 255 }).notNull(),
        count: integer('count').default(1),
        lastSearchedAt: timestamp('last_searched_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        idxSearchQuery: index('idx_search_query').on(table.query),
    })
);

/**
 * Type Exports
 */
export type FlashSale = typeof flashSales.$inferSelect;
export type NewFlashSale = typeof flashSales.$inferInsert;

export type FlashSaleProduct = typeof flashSaleProducts.$inferSelect;
export type NewFlashSaleProduct = typeof flashSaleProducts.$inferInsert;

export type BentoGrid = typeof bentoGrids.$inferSelect;
export type NewBentoGrid = typeof bentoGrids.$inferInsert;
