/**
 * Payment Logs Schema
 *
 * Forensic logs for payment transactions, successes, and failures.
 *
 * @module @apex/db/schema/storefront/payment-logs
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
 * Payment Logs Table
 */
export const paymentLogs = pgTable('payment_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, {
    onDelete: 'cascade',
  }),

  provider: varchar('provider', { length: 50 }).notNull(), // Stripe, PayPal, COD
  transactionId: varchar('transaction_id', { length: 255 }),

  status: varchar('status', { length: 20 }).notNull(), // success, failed, pending

  errorCode: varchar('error_code', { length: 100 }),
  errorMessage: text('error_message'),

  // Full provider response for forensic analysis
  rawResponse: jsonb('raw_response'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Type Exports
 */
export type PaymentLog = typeof paymentLogs.$inferSelect;
export type NewPaymentLog = typeof paymentLogs.$inferInsert;
