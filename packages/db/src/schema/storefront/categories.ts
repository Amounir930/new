/**
 * Storefront Categories Schema — V5
 *
 * Hierarchical categories with JSONB i18n, soft deletes.
 *
 * @module @apex/db/schema/storefront/categories
 */

import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';

/**
 * Categories Table — self-referencing hierarchy
 * Column alignment: UUID → TIMESTAMPTZ → INT → BOOLEAN → TEXT → JSONB
 */
export const categories = storefrontSchema.table(
  'categories',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, precision: 6 }),

    // ── Integer ──
    sortOrder: integer('sort_order').default(0),
    productsCount: integer('products_count').default(0),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar ──
    slug: text('slug').notNull(),
    icon: text('icon'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    imageUrl: text('image_url'),
    bannerUrl: text('banner_url'),

    // ── JSONB (Decision #5) ──
    name: jsonb('name').notNull(),
    description: jsonb('description'),
  },
  (table) => ({
    // Directive #12: Soft-delete safe unique index for categories.
    idxCategoriesSlug: uniqueIndex('idx_categories_slug_active')
      .on(table.slug)
      .where(sql`deleted_at IS NULL`),
    idxCategoriesParent: index('idx_categories_parent').on(table.parentId),
    idxCategoriesActive: index('idx_categories_active')
      .on(table.isActive)
      .where(sql`deleted_at IS NULL`),
  })
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
