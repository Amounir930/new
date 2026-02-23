/**
 * Storefront Product Schema
 *
 * Core product tables for e-commerce templates.
 * All tables exist within tenant-specific schemas (S2 isolation).
 *
 * @module @apex/db/schema/storefront/products
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  customType,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { brands } from './brands';
import { categories } from './categories';

/**
 * S3: AI/Vector Search Support (pgvector)
 */
const vector = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
});

/**
 * Products Table
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // 1. Primary Info
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    nameAr: varchar('name_ar', { length: 255 }).notNull(),
    nameEn: varchar('name_en', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).unique().notNull(),
    brandId: uuid('brand_id').references(() => brands.id),
    categoryId: uuid('category_id').references(() => categories.id),

    // 2. Pricing & Inventory
    basePrice: decimal('base_price', { precision: 12, scale: 2 }).notNull(),
    salePrice: decimal('sale_price', { precision: 12, scale: 2 }),
    taxPercentage: decimal('tax_percentage', { precision: 5, scale: 2 }).default('0.00'),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    minOrderQty: integer('min_order_qty').default(1),
    trackInventory: boolean('track_inventory').default(true),

    // 3. Technical & Logistics
    weight: decimal('weight', { precision: 10, scale: 3 }), // kg
    dimensions: jsonb('dimensions'), // { h, w, l }
    packageContentsAr: text('package_contents_ar'),
    packageContentsEn: text('package_contents_en'),
    countryOfOrigin: varchar('country_of_origin', { length: 100 }),

    // 4. Content & Media
    shortDescriptionAr: varchar('short_description_ar', { length: 1000 }),
    shortDescriptionEn: varchar('short_description_en', { length: 1000 }),
    longDescriptionAr: text('long_description_ar'),
    longDescriptionEn: text('long_description_en'),
    mainImage: text('main_image').notNull(),
    galleryImages: jsonb('gallery_images').default([]), // Array of URLs
    videoUrl: text('video_url'),

    // 5. Trust & Policies
    warrantyPeriod: integer('warranty_period'), // months
    warrantyPolicyAr: text('warranty_policy_ar'),
    warrantyPolicyEn: text('warranty_policy_en'),
    isReturnable: boolean('is_returnable').default(true),
    returnPeriod: integer('return_period').default(14), // days

    // 6. SEO Metadata
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    keywords: text('keywords'),

    // 7. Dynamic Niche-Specific (S2/S15)
    specifications: jsonb('specifications').default({}), // CPU, RAM, Color, Size, etc.

    // AI & System
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),
    embedding: vector('embedding', { dimensions: 1536 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxProductsSlug: index('idx_products_slug').on(table.slug),
    idxProductsSku: index('idx_products_sku').on(table.sku),
    idxProductsCategory: index('idx_products_category').on(table.categoryId),
    idxProductsBrand: index('idx_products_brand').on(table.brandId),
    idxProductsActive: index('idx_products_active')
      .on(table.isActive)
      .where(sql`is_active = true`),
  })
);

/**
 * Product Images Table
 */
export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    url: text('url').notNull(), // MinIO URL
    altText: varchar('alt_text', { length: 255 }),
    isPrimary: boolean('is_primary').default(false),
    order: integer('order').default(0),
  },
  (table) => ({
    idxProductImagesProduct: index('idx_product_images_product').on(
      table.productId
    ),
  })
);

/**
 * Product Variants Table
 */
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    sku: varchar('sku', { length: 100 }).unique(),
    name: varchar('name', { length: 255 }), // e.g., "Red / XL"

    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
    quantity: integer('quantity').notNull().default(0),

    attributes: jsonb('attributes').notNull(), // { color: "Red", size: "XL" }
    imageUrl: text('image_url'),
  },
  (table) => ({
    idxVariantsProduct: index('idx_variants_product').on(table.productId),
    idxVariantsAttributes: index('idx_variants_attributes').on(
      table.attributes
    ),
  })
);

/**
 * Product Tags Table (many-to-many)
 */
export const productTags = pgTable(
  'product_tags',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    tag: varchar('tag', { length: 50 }).notNull(),
  },
  (table) => ({
    pk: unique().on(table.productId, table.tag),
  })
);

// Type exports
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type ProductTag = typeof productTags.$inferSelect;
export type NewProductTag = typeof productTags.$inferInsert;
