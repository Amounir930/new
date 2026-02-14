/**
 * Storefront Category Schema
 *
 * Product categorization tables for templates.
 *
 * @module @apex/db/schema/storefront/categories
 */
import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Categories Table (supports nested hierarchy)
 */
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'), // Category icon/thumbnail
    bannerUrl: text('banner_url'), // Large banner for category page
    // SEO
    metaTitle: varchar('meta_title', { length: 150 }),
    metaDescription: varchar('meta_description', { length: 255 }),
    parentId: uuid('parent_id').references(() => categories.id), // Self-reference
    order: integer('order').default(0), // Display order
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    idxCategoriesParent: index('idx_categories_parent').on(table.parentId),
    idxCategoriesActive: index('idx_categories_active').on(table.isActive),
}));
//# sourceMappingURL=categories.js.map