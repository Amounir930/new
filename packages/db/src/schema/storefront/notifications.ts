/**
 * Notifications Schema — V5
 *
 * Tables for user-facing notifications.
 *
 * @module @apex/db/schema/storefront/notifications
 */

import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { ulidId } from '../v5-core';
import { customers } from './customers';

/**
 * Notifications Table
 * Column alignment: UUID → TIMESTAMPTZ → BOOLEAN → TEXT
 */
export const notifications = pgTable(
  'notifications',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Boolean ──
    isRead: boolean('is_read').default(false),

    // ── Scalar ──
    type: text('type').default('general'),
    title: text('title').notNull(),
    content: text('content').notNull(),
    metadata: text('metadata'),
  },
  (table) => ({
    idxNotificationCustomer: index('idx_notification_customer').on(
      table.customerId
    ),
    idxNotificationCreated: index('idx_notification_created').on(
      table.createdAt
    ),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
