/**
 * Storefront Content Schema
 *
 * Static pages and blog tables for templates.
 *
 * @module @apex/db/schema/storefront/content
 */
import { boolean, index, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Pages Table (static CMS pages)
 */
export const pages = pgTable('pages', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content'), // HTML/Markdown
    metaTitle: varchar('meta_title', { length: 60 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    isPublished: boolean('is_published').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    idxPagesSlug: index('idx_pages_slug').on(table.slug),
    idxPagesPublished: index('idx_pages_published').on(table.isPublished),
}));
/**
 * Blog Posts Table
 */
export const blogPosts = pgTable('blog_posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    excerpt: varchar('excerpt', { length: 500 }),
    content: text('content').notNull(),
    featuredImage: text('featured_image'),
    authorName: varchar('author_name', { length: 100 }),
    isPublished: boolean('is_published').default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    idxBlogPostsSlug: index('idx_blog_posts_slug').on(table.slug),
    idxBlogPostsPublished: index('idx_blog_posts_published').on(table.isPublished),
    idxBlogPostsPublishedAt: index('idx_blog_posts_published_at').on(table.publishedAt),
}));
//# sourceMappingURL=content.js.map