/**
 * Storefront Order Timeline Schema — V5 Enterprise Hardening
 *
 * Audit trail for order-related events.
 * High Volume: BRIN indexing on createdAt.
 *
 * @module @apex/db/schema/storefront/timeline
 */

import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ulidId } from '../v5-core';
import { orders } from './orders';

/**
 * Order Timeline Table
 * Alignment: UUID -> TIMESTAMPTZ -> TEXT -> JSONB
 */
export const orderTimeline = pgTable(
  'order_timeline',
  {
    // ── Fixed (Alignment Tier 1) ──
    id: ulidId(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Scalar (Alignment Tier 2) ──
    event: text('event').notNull(), // order_shipped, payment_authorized
    actorType: text('actor_type').notNull(), // admin, customer, system
    actorId: text('actor_id'),

    // ── JSONB (Variable) ──
    metadata: text('metadata'), // JSON string or text details
  },
  (table) => ({
    idxTimelineOrder: index('idx_timeline_order').on(table.orderId),
    // Performance: BRIN for sequential timeline tracking
    idxTimelineCreated: index('idx_timeline_created_brin').using(
      'brin',
      table.createdAt
    ),
  })
);

export type OrderTimeline = typeof orderTimeline.$inferSelect;
