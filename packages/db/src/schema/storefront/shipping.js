/**
 * Shipping and Zones Schema
 *
 * Tables for shipping methods and regional zones.
 *
 * @module @apex/db/schema/storefront/shipping
 */
import { decimal, index, integer, pgTable, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Shipping Zones Table
 */
export const shippingZones = pgTable('shipping_zones', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "Egypt - Cairo", "Saudi Arabia - Riyadh"
    region: varchar('region', { length: 100 }).notNull(),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
    estimatedDays: varchar('estimated_days', { length: 50 }), // e.g., "2-3 days"
    isActive: integer('is_active').default(1), // 1 = active, 0 = inactive
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    idxShippingRegion: index('idx_shipping_region').on(table.region),
    idxShippingActive: index('idx_shipping_active').on(table.isActive),
}));
//# sourceMappingURL=shipping.js.map