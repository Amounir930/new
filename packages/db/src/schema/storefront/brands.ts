/**
 * Storefront Brands Schema — V5
 *
 * Brand registry with JSONB i18n, soft deletes.
 *
 * @module @apex/db/schema/storefront/brands
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { deletedAt, storefrontSchema, ulidId } from '../v5-core';

/**
 * Brands Table
 * Column alignment: UUID → TIMESTAMPTZ → BOOLEAN → TEXT → JSONB
 */
export const brands = storefrontSchema.table(
  'brands',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: deletedAt(),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar ──
    slug: text('slug').notNull(),
    country: text('country'),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),

    // ── JSONB (Decision #5) ──
    name: jsonb('name').notNull(),
    description: jsonb('description'),
  },
  (table) => ({
    idxBrandsSlug: uniqueIndex('idx_brands_slug_active')
      .on(table.tenantId, table.slug)
      .where(sql`deleted_at IS NULL`),
    idxBrandsActive: index('idx_brands_active')
      .on(table.isActive)
      .where(sql`deleted_at IS NULL`),
  })
);

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
