/**
 * Storefront Advanced Catalog Schema — V5 Enterprise Hardening
 *
 * Tables: smart_collections, product_bundles, bundle_items, synonyms.
 * Logic: Dynamic Collections + Bundle Pricing.
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
import { moneyAmount, storefrontSchema, ulidId } from '../v5-core';
import { products, productVariants } from './products';

/**
 * 🧠 Smart Collections (Dynamic Filtering)
 */
export const smartCollections = storefrontSchema.table('smart_collections', {
  // ── 1. Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. Boolean ──
  isActive: boolean('is_active').default(true).notNull(),

  // ── 3. Scalar ──
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),

  // ── 4. JSONB (Rules for selection) ──
  rules: jsonb('rules').notNull(), // [{"column": "tag", "relation": "equals", "condition": "Sale"}]
});

/**
 * 📦 Product Bundles
 */
export const productBundles = storefrontSchema.table('product_bundles', {
  // ── 1. Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. Money ──
  bundlePrice: moneyAmount('bundle_price').notNull(),

  // ── 3. Boolean ──
  isActive: boolean('is_active').default(true).notNull(),

  // ── 4. Scalar ──
  title: text('title').notNull(),
  sku: text('sku').notNull().unique(),
});

/**
 * 🔗 Bundle Items (Reference Layer)
 */
export const productBundleItems = storefrontSchema.table(
  'product_bundle_items',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => productBundles.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id),

    // ── 2. Integer ──
    quantity: integer('quantity').default(1).notNull(),
  }
);

/**
 * 🔍 Search Synonyms
 */
export const searchSynonyms = storefrontSchema.table('search_synonyms', {
  // ── 1. Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. Array ──
  terms: text('terms').array().notNull(), // ["phone", "mobile", "cellphone"]
});

// Type Exports
export type SmartCollection = typeof smartCollections.$inferSelect;
export type ProductBundle = typeof productBundles.$inferSelect;
export type SearchSynonym = typeof searchSynonyms.$inferSelect;
