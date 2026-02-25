/**
 * Knowledge Base (Help Center) Schema — V5
 *
 * Tables for support articles and technical documentation.
 *
 * @module @apex/db/schema/storefront/knowledge-base
 */

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { ulidId } from '../v5-core';

/**
 * Knowledge Base Categories
 */
export const kbCategories = pgTable('kb_categories', {
  // ── Fixed (Alignment) ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  // ── Integer ──
  order: integer('order').default(0),

  // ── Scalar ──
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
});

/**
 * Knowledge Base Articles
 * Column alignment: UUID → TIMESTAMPTZ → INT → BOOLEAN → TEXT
 */
export const kbArticles = pgTable(
  'kb_articles',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    categoryId: uuid('category_id').references(() => kbCategories.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    // ── Integer ──
    viewCount: integer('view_count').default(0),

    // ── Boolean ──
    isPublished: boolean('is_published').default(true),

    // ── Scalar ──
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(),
  },
  (table) => ({
    idxKbArticleSlug: index('idx_kb_article_slug').on(table.slug),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type KbCategory = typeof kbCategories.$inferSelect;
export type KbArticle = typeof kbArticles.$inferSelect;
