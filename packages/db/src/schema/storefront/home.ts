/**
 * Home Page Extended Configuration & Marketing Schema
 *
 * Tables for Flash Sales, Bento Grids, and Sectional marketing.
 *
 * @module @apex/db/schema/storefront/home
 */

import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgMaterializedView,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { products } from './products';
import { orderItems, orders } from './orders';

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
    flashSaleId: uuid('flash_sale_id').references(() => flashSales.id, {
      onDelete: 'cascade',
    }),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'cascade',
    }),

    discountPercentage: decimal('discount_percentage', {
      precision: 5,
      scale: 2,
    }).notNull(),
    quantityLimit: integer('quantity_limit').notNull(),
    soldQuantity: integer('sold_quantity').default(0),

    order: integer('order').default(0),
  },
  (table) => ({
    idxFlashSaleProdCampaign: index('idx_fs_prod_campaign').on(
      table.flashSaleId
    ),
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
    lastSearchedAt: timestamp('last_searched_at', {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => ({
    idxSearchQuery: index('idx_search_query').on(table.query),
  })
);

/**
 * Hero Banners Table (Rotating Carousel)
 * BR-01-SEC Compliance
 */
export const banners = pgTable(
  'banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: text('subtitle'),
    imageUrl: text('image_url').notNull(),
    mobileImageUrl: text('mobile_image_url'),
    linkUrl: text('link_url'),
    ctaText: varchar('cta_text', { length: 50 }).default('Shop Now'),
    position: varchar('position', { length: 20 }).default('hero'), // hero, featured, popup
    priority: integer('priority').default(0),
    active: boolean('active').default(true),
    backgroundColor: varchar('background_color', { length: 7 }), // Hex
    textColor: varchar('text_color', { length: 7 }), // Hex
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxBannersActive: index('idx_banners_active').on(table.active),
    idxBannersPriority: index('idx_banners_priority').on(table.priority),
  })
);

/**
 * Best Sellers Materialized View
 * BR-01-SEC Compliance
 */
export const mvBestSellers = pgMaterializedView('mv_best_sellers', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  price: decimal('price', { precision: 10, scale: 2 }),
  imageUrl: text('image_url'),
  totalSold: integer('total_sold'),
}).as(sql`
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
    COALESCE(SUM(oi.quantity), 0) as total_sold
  FROM products p
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.slug, p.price
  ORDER BY total_sold DESC
`);

/**
 * Newsletter Subscribers Table
 * Lead capture for storefront
 */
export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    status: varchar('status', { length: 20 }).default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxNewsletterEmail: index('idx_newsletter_email').on(table.email),
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

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
