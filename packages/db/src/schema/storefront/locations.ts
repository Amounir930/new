/**
 * Storefront Locations Schema — V5 Enterprise Hardening
 *
 * Tables: store_locations.
 * Intelligence: PostGIS Geography(Point) for Logistics.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { locationTypeEnum } from '../enums';
import { deletedAt, geographyPoint, ulidId } from '../v5-core';

/**
 * 🏤 Store / Warehouse Locations
 * ALIGNMENT: UUID -> TS -> BOOL -> ENUM -> TEXT -> GEOGRAPHY
 */
export const storeLocations = pgTable(
  'store_locations',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: deletedAt(),

    // ── 2. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),

    // ── 3. Enum ──
    type: locationTypeEnum('type').default('warehouse').notNull(),

    // ── 4. Text ──
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    address: text('address'),
    timezone: text('timezone').default('Asia/Riyadh'),

    // ── 5. Spatial (Point #12) ──
    coordinates: geographyPoint('coordinates'),
  },
  (table) => ({
    idxLocActive: index('idx_locations_active')
      .on(table.isActive)
      .where(sql`deleted_at IS NULL`),
    // Spatial GIST index usually created via raw SQL for geography
    idxLocGeo: index('idx_locations_geo').using('gist', table.coordinates),
  })
);

// Type Exports
export type StoreLocation = typeof storeLocations.$inferSelect;
