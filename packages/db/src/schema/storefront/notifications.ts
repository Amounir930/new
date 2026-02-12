/**
 * Notifications Schema
 * 
 * Tables for user-facing notifications.
 * 
 * @module @apex/db/schema/storefront/notifications
 */

import {
    boolean,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { customers } from './customers';

/**
 * Notifications Table
 */
export const notifications = pgTable(
    'notifications',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        customerId: uuid('customer_id')
            .notNull()
            .references(() => customers.id, { onDelete: 'cascade' }),

        title: varchar('title', { length: 255 }).notNull(),
        content: text('content').notNull(),

        type: varchar('type', { length: 50 }).default('general'), // order, promo, system, wallet
        isRead: boolean('is_read').default(false),

        metadata: varchar('metadata', { length: 500 }), // JSON string for action links, etc.

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    }
);

/**
 * Type Exports
 */
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
