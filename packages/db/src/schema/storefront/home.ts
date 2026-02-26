/**
 * Home Page Extended Configuration & Marketing Schema — V5
 *
 * Flash Sales, Bento Grids, Banners, Search Analytics, Newsletter.
 *
 * @module @apex/db/schema/storefront/home
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { deletedAt, storefrontSchema, ulidId } from '../v5-core';
import { products } from './products';

// ─── Flash Sales ─────────────────────────────────────────────
export const flashSales = storefrontSchema.table(
  'flash_sales',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    deletedAt: deletedAt(),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar ──
    status: text('status').default('active'),

    // ── JSONB (Decision #5) ──
    name: jsonb('name').notNull(),
  },
  (table) => ({
    idxFlashSalesStatus: index('idx_flash_sales_status')
      .on(table.status)
      .where(sql`deleted_at IS NULL`),
    idxFlashSalesEndTime: index('idx_flash_sales_end_time').on(table.endTime),
  })
);

export const flashSaleProducts = storefrontSchema.table(
  'flash_sale_products',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    flashSaleId: uuid('flash_sale_id').references(() => flashSales.id, {
      onDelete: 'cascade',
    }),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'cascade',
    }),

    // ── Integer ──
    discountBasisPoints: integer('discount_basis_points').notNull(),
    quantityLimit: integer('quantity_limit').notNull(),
    soldQuantity: integer('sold_quantity').default(0),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => ({
    idxFlashSaleProdCampaign: index('idx_fs_prod_campaign').on(
      table.flashSaleId
    ),
    idxFlashSaleProdProduct: index('idx_fs_prod_product').on(table.productId),
  })
);

// ─── Layouts & UI ────────────────────────────────────────────
export const bentoGrids = storefrontSchema.table('bento_grids', {
  // ── Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: deletedAt(),

  // ── Scalar ──
  layoutId: text('layout_id').notNull(),

  // ── JSONB ──
  name: jsonb('name').notNull(),
  slots: jsonb('slots').notNull(),
});

export const banners = storefrontSchema.table(
  'banners',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    deletedAt: deletedAt(),

    // ── Integer ──
    priority: integer('priority').default(0),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar ──
    position: text('position').default('hero'),
    ctaText: text('cta_text').default('Shop Now'),
    backgroundColor: text('background_color'),
    textColor: text('text_color'),
    imageUrl: text('image_url').notNull(),
    mobileImageUrl: text('mobile_image_url'),
    linkUrl: text('link_url'),

    // ── JSONB ──
    title: jsonb('title').notNull(),
    subtitle: jsonb('subtitle'),
  },
  (table) => ({
    idxBannersActive: index('idx_banners_active')
      .on(table.isActive)
      .where(sql`deleted_at IS NULL`),
    idxBannersPriority: index('idx_banners_priority').on(table.priority),
  })
);

// ─── Marketing Analytics ─────────────────────────────────────
export const searchAnalytics = storefrontSchema.table(
  'search_analytics',
  {
    // ── Fixed ──
    id: ulidId(),
    lastSearchedAt: timestamp('last_searched_at', {
      withTimezone: true,
    }).defaultNow(),

    // ── Integer ──
    count: integer('count').default(1),

    // ── Scalar ──
    query: text('query').notNull(),
  },
  (table) => ({
    idxSearchQuery: index('idx_search_query').on(table.query),
  })
);

export const newsletterSubscribers = storefrontSchema.table(
  'newsletter_subscribers',
  {
    // ── Fixed ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar (S7 Encrypted) ──
    email: text('email').notNull(),
    source: text('source'),
  },
  (table) => ({
    idxNewsletterActive: index('idx_newsletter_active').on(table.isActive),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type FlashSale = typeof flashSales.$inferSelect;
export type FlashSaleProduct = typeof flashSaleProducts.$inferSelect;
export type BentoGrid = typeof bentoGrids.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
