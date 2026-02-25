/**
 * Storefront Wallet Transactions Schema — V5 Enterprise Hardening
 *
 * Immutable ledger for customer store credit.
 * Financial Integrity: money_amount composite + Not-NULL balances.
 *
 * @module @apex/db/schema/storefront/wallet-transactions
 */

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { moneyAmount, ulidId } from '../v5-core';
import { customers } from './customers';

/**
 * Wallet Transactions Table (Ledger)
 * Alignment: UUID -> TIMESTAMPTZ -> MONEY -> TEXT
 */
export const walletTransactions = pgTable(
  'wallet_transactions',
  {
    // ── Fixed (Alignment Tier 1) ──
    id: ulidId(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Money (Alignment Tier 2) ──
    amount: moneyAmount('amount').notNull(),
    balanceAfter: moneyAmount('balance_after').notNull(),

    // ── Scalar / Text ──
    type: text('type').notNull(), // deposit, withdrawal, refund, order_payment
    referenceId: text('reference_id'), // order_id or external_tx_id
    description: text('description'),
  },
  (table) => ({
    idxWalletCustomer: index('idx_wallet_customer').on(table.customerId),
    idxWalletCreated: index('idx_wallet_created_brin').using(
      'brin',
      table.createdAt
    ),
    // Fatal Mandate #21: Physical Non-Negative Balance Check
    balanceCheck: check(
      'ck_wallet_balance_positive',
      sql`("balance_after"->>'amount')::BIGINT >= 0`
    ),
  })
);

export type WalletTransaction = typeof walletTransactions.$inferSelect;
