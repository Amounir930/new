/**
 * Knowledge Base (Help Center) Schema
 *
 * Tables for support articles and technical documentation.
 *
 * @module @apex/db/schema/storefront/knowledge-base
 */
import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Knowledge Base Categories
 */
export const kbCategories = pgTable('kb_categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    icon: varchar('icon', { length: 50 }),
    order: integer('order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
/**
 * Knowledge Base Articles
 */
export const kbArticles = pgTable('kb_articles', {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id').references(() => kbCategories.id, {
        onDelete: 'cascade',
    }),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    isPublished: boolean('is_published').default(true),
    viewCount: integer('view_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    idxKbArticleSlug: index('idx_kb_article_slug').on(table.slug),
}));
//# sourceMappingURL=knowledge-base.js.map