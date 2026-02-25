/**
 * Storefront Content Schema — V5
 *
 * Static pages and blog posts with JSONB i18n, soft deletes.
 *
 * @module @apex/db/schema/storefront/content
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
} from 'drizzle-orm/pg-core';
import { deletedAt, ulidId } from '../v5-core';

/**
 * Pages Table (static CMS pages)
 * Column alignment: UUID → TIMESTAMPTZ → INT → BOOLEAN → TEXT → JSONB
 */
export const pages = pgTable(
  'pages',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: deletedAt(),

    // ── Boolean ──
    isPublished: boolean('is_published').default(false),

    // ── Scalar ──
    slug: text('slug').notNull(),
    pageType: text('page_type').default('custom'),
    template: text('template').default('default'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),

    // ── JSONB (Decision #5) ──
    title: jsonb('title').notNull(),
    content: jsonb('content'),
  },
  (table) => ({
    idxPagesSlug: index('idx_pages_slug_active')
      .on(table.slug)
      .where(sql`deleted_at IS NULL`),
    idxPagesPublished: index('idx_pages_published').on(table.isPublished),
  })
);

/**
 * Blog Posts Table — i18n + enhanced metadata
 */
export const blogPosts = pgTable(
  'blog_posts',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: deletedAt(),

    // ── Integer ──
    readTimeMin: integer('read_time_min'),
    viewCount: integer('view_count').default(0),

    // ── Boolean ──
    isPublished: boolean('is_published').default(false),

    // ── Scalar ──
    slug: text('slug').notNull(),
    category: text('category'),
    authorName: text('author_name'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    featuredImage: text('featured_image'),

    // ── TEXT[] ──
    tags: text('tags').array().default(sql`'{}'::text[]`),

    // ── JSONB (Decision #5) ──
    title: jsonb('title').notNull(),
    excerpt: jsonb('excerpt'),
    content: jsonb('content').notNull(),
  },
  (table) => ({
    idxBlogSlug: index('idx_blog_slug_active')
      .on(table.slug)
      .where(sql`deleted_at IS NULL`),
    idxBlogPublished: index('idx_blog_published').on(table.isPublished),
    idxBlogPublishedAt: index('idx_blog_published_at').on(table.publishedAt),
    idxBlogTags: index('idx_blog_tags').on(table.tags),
  })
);

// Type Exports
export type Page = typeof pages.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
