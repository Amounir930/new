/**
 * RMA (Return Merchandise Authorization) Schema — V5 Enterprise Hardening
 *
 * Tables for managing product returns.
 * Logic: RESTRICT on orders + order_items (preserve financial trail).
 *
 * @module @apex/db/schema/storefront/rma
 */

import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  rmaConditionEnum,
  rmaReasonCodeEnum,
  rmaResolutionEnum,
} from '../enums';
import { ulidId } from '../v5-core';
import { orderItems, orders } from './orders';

/**
 * RMA Requests Table
 * Alignment: UUID -> TIMESTAMPTZ -> ENUM -> TEXT -> JSONB
 */
export const rmaRequests = pgTable(
  'rma_requests',
  {
    // ── Fixed (Alignment Tier 1) ──
    id: ulidId(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    // ── Enum (Alignment Tier 2/3) ──
    reasonCode: rmaReasonCodeEnum('reason_code').notNull(),
    condition: rmaConditionEnum('condition').default('new').notNull(),
    resolution: rmaResolutionEnum('resolution').default('refund').notNull(),

    // ── Scalar ──
    status: text('status').default('pending').notNull(),
    description: text('description'),

    // ── JSONB (Variable) ──
    evidence: jsonb('evidence').default([]),
  },
  (table) => ({
    idxRmaOrder: index('idx_rma_order').on(table.orderId),
    idxRmaStatus: index('idx_rma_status').on(table.status),
  })
);

export type RmaRequest = typeof rmaRequests.$inferSelect;
