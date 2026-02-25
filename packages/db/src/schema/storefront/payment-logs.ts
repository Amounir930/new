/**
 * Storefront Payment Logs Schema — V5 Enterprise Hardening
 *
 * Forensic record of external gateway interactions.
 * High Volume: BRIN indexing for audit compliance.
 *
 * @module @apex/db/schema/storefront/payment-logs
 */

import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ulidId } from '../v5-core';
import { orders } from './orders';

/**
 * Payment Logs Table
 * Alignment: UUID -> TIMESTAMPTZ -> TEXT
 */
export const paymentLogs = pgTable(
  'payment_logs',
  {
    // ── Fixed ──
    id: ulidId(),
    orderId: uuid('order_id').references(() => orders.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Scalar ──
    gateway: text('gateway').notNull(), // Stripe, PayPal, Moyasar
    action: text('action').notNull(), // authorize, capture, webhook_received
    status: text('status').notNull(), // success, failure
    requestPayload: text('request_payload'),
    responsePayload: text('response_payload'),
    errorMessage: text('error_message'),
  },
  (table) => ({
    idxPaymentLogOrder: index('idx_payment_log_order').on(table.orderId),
    // Performance: BRIN for high-volume logs
    idxPaymentLogCreated: index('idx_payment_log_created_brin').using(
      'brin',
      table.createdAt
    ),
  })
);

export type PaymentLog = typeof paymentLogs.$inferSelect;
