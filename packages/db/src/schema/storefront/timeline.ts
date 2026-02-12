/**
 * Order Timeline Schema
 * 
 * Snapshot history for order status changes and tracking events.
 * 
 * @module @apex/db/schema/storefront/timeline
 */

import {
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';

/**
 * Order Timeline Table
 */
export const orderTimeline = pgTable(
    'order_timeline',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),

        status: varchar('status', { length: 50 }).notNull(), // pending, shipped, etc.
        title: varchar('title', { length: 255 }), // Display title in Arabic/English
        notes: text('notes'), // Detailed description

        // Optional snapshot of location { city: string, lat: number, lng: number }
        location: jsonb('location'),

        updatedBy: uuid('updated_by'), // Reference to admin/staff id

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    }
);

/**
 * Type Exports
 */
export type OrderTimeline = typeof orderTimeline.$inferSelect;
export type NewOrderTimeline = typeof orderTimeline.$inferInsert;
