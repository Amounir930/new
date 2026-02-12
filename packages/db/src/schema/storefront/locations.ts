/**
 * Store Locations Schema
 *
 * Tables for physical store branches and geographic data.
 *
 * @module @apex/db/schema/storefront/locations
 */

import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Store Locations Table
 */
export const storeLocations = pgTable(
  'store_locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address').notNull(),

    // Geographic data { lat: number, lng: number }
    coordinates: jsonb('coordinates'),

    // Operating hours { Mon: "09:00 - 18:00", ... }
    hours: jsonb('hours'),

    phoneNumber: varchar('phone_number', { length: 50 }),
    email: varchar('email', { length: 255 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    idxLocationName: index('idx_location_name').on(table.name),
  })
);

/**
 * Type Exports
 */
export type StoreLocation = typeof storeLocations.$inferSelect;
export type NewStoreLocation = typeof storeLocations.$inferInsert;
