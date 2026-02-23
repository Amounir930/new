/**
 * Storefront Brands Schema
 *
 * @module @apex/db/schema/storefront/brands
 */

import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const brands = pgTable(
    'brands',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull().unique(),
        description: text('description'),
        logoUrl: text('logo_url'),
        websiteUrl: text('website_url'),
        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        idxBrandsSlug: index('idx_brands_slug').on(table.slug),
        idxBrandsActive: index('idx_brands_active').on(table.isActive),
    })
);

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
