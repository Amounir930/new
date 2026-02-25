/**
 * Storefront Products Schema — V5 Enterprise Hardening
 *
 * Tables: products, images, variants, tags, attributes.
 * Engineering: HNSW Vector Search + GIN i18n + Strict Alignment.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { deletedAt, grams, moneyAmount, occVersion, ulidId } from '../v5-core';
import { brands } from './brands';
import { categories } from './categories';

/**
 * Enterprise Decision #9: pgvector(1536) for Semantic Search.
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value) {
    return value
      .replace(/[\[\]]/g, '')
      .split(',')
      .map(Number);
  },
});

/**
 * 🛒 Products Table
 * ABSOLUTE ALIGNMENT: UUID -> TS -> BIGINT -> INT -> BOOL -> TEXT -> ARRAY -> JSONB -> VECTOR
 */
export const products = pgTable(
  'products',
  {
    // ── 1. Fixed (UUID/ULID) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    brandId: uuid('brand_id').references(() => brands.id),
    categoryId: uuid('category_id').references(() => categories.id),

    // ── 2. Timestamps ──
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      precision: 6,
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, precision: 6 }),

    // ── 3. BigInt / Money ──
    basePrice: moneyAmount('base_price').notNull(),
    salePrice: moneyAmount('sale_price'),
    costPrice: moneyAmount('cost_price'),

    // ── 4. Integer ──
    sortOrder: integer('sort_order').default(0),
    viewCount: integer('view_count').default(0),
    lowStockThreshold: integer('low_stock_threshold').default(5),
    weightGrams: grams('weight_grams').default(0),

    // ── 5. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isDigital: boolean('is_digital').default(false).notNull(),
    trackInventory: boolean('track_inventory').default(true).notNull(),

    // ── 6. Varchar / Text ──
    slug: text('slug').notNull(),
    sku: text('sku').notNull(),
    barcode: text('barcode'),
    mainImage: text('main_image'),
    videoUrl: text('video_url'),

    // ── 7. Arrays (Native PG) ──
    tags: text('tags').array().default([]), // Fixed: [] instead of default([''])

    // ── 8. JSONB (Variable / i18n) ──
    name: jsonb('name').notNull(), // Decision #11: {"ar": "...", "en": "..."}
    description: jsonb('description'),
    specifications: jsonb('specifications').default({}),

    // ── 9. Vectors ──
    embedding: vector('embedding'),

    // ── 10. OCC ──
    version: occVersion(),
  },
  (table) => ({
    // Partial Indices (Point 17)
    idxProductsSlug: uniqueIndex('idx_products_slug_active')
      .on(table.tenantId, table.slug)
      .where(sql`deleted_at IS NULL`),
    idxProductsSku: uniqueIndex('idx_products_sku_active')
      .on(table.tenantId, table.sku)
      .where(sql`deleted_at IS NULL`),

    // GIN Indices for i18n (Point 19)
    idxProductsNameGin: index('idx_products_name_gin').using('gin', table.name),
    idxProductsTagsGin: index('idx_products_tags_gin').using('gin', table.tags),

    // HNSW for vectors (Point 18)
    idxProductsVectorHnsw: index('idx_products_ai_vector').using(
      'hnsw',
      table.embedding
    ),

    idxProductsActive: index('idx_products_active')
      .on(table.isActive)
      .where(sql`deleted_at IS NULL`),
    // Directive #27: Covering Index implemented natively in raw SQL override
    // due to Drizzle limitations with INCLUDE clauses.
  })
);

/**
 * 📦 Product Variants
 * Optimistic Locking: Handled at level logic.
 */
export const productVariants = pgTable(
  'product_variants',
  {
    // ── Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, precision: 6 }),

    // ── Money ──
    price: moneyAmount('price').notNull(),

    // ── Integer ──
    weightGrams: grams('weight_grams'),

    // ── Scalar ──
    sku: text('sku').notNull(),
    barcode: text('barcode'),
    imageUrl: text('image_url'),

    // ── JSONB ──
    options: jsonb('options').notNull(), // {"Size": "L", "Color": "Red"}
  },
  (table) => ({
    idxVariantSku: uniqueIndex('idx_variants_sku_active')
      .on(table.tenantId, table.sku)
      .where(sql`deleted_at IS NULL`),
    idxVariantProduct: index('idx_variants_product').on(table.productId),
  })
);

// Type Exports
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
