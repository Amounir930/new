/**
 * Size Guides Schema — V5
 *
 * Tables for product sizing information and interactive guides.
 *
 * @module @apex/db/schema/storefront/size-guides
 */

import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ulidId } from '../v5-core';
import { categories } from './categories';
import { products } from './products';

/**
 * Size Guides Table
 * Column alignment: UUID → TIMESTAMPTZ → TEXT → JSONB
 */
export const sizeGuides = pgTable('size_guides', {
  // ── Fixed (Alignment) ──
  id: ulidId(),
  categoryId: uuid('category_id').references(() => categories.id),
  productId: uuid('product_id').references(() => products.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

  // ── Scalar ──
  name: text('name').notNull(),

  // ── JSONB (Decision #5) ──
  tableData: jsonb('table_data').notNull(),
});

// ─── Type Exports ───────────────────────────────────────────
export type SizeGuide = typeof sizeGuides.$inferSelect;
export type NewSizeGuide = typeof sizeGuides.$inferInsert;
