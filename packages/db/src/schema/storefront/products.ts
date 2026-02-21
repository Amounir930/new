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

    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),

    // Pricing
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }), // S7: Encrypted
    currency: char('currency', { length: 3 }).notNull().default('USD'),

    // Categorization
    categoryId: uuid('category_id').references(() => categories.id),
    brand: varchar('brand', { length: 100 }),

    // SKU & Inventory
    sku: varchar('sku', { length: 100 }).unique(),
    barcode: varchar('barcode', { length: 50 }),
    quantity: integer('quantity').notNull().default(0),
    trackInventory: boolean('track_inventory').default(true),
    weight: decimal('weight', { precision: 8, scale: 3 }),

    // Flags
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),

    // AI Similarity (S3)
    embedding: vector('embedding', { dimensions: 1536 }),

    // SEO
    metaTitle: varchar('meta_title', { length: 60 }),
    metaDescription: varchar('meta_description', { length: 160 }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxProductsSlug: index('idx_products_slug').on(table.slug),
    idxProductsCategory: index('idx_products_category').on(table.categoryId),
    idxProductsActive: index('idx_products_active')
      .on(table.isActive)
      .where(sql`is_active = true`),
    // Full-text search index
    idxProductsSearch: index('idx_products_search').on(table.name),
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
