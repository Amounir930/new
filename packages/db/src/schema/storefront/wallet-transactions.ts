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
import { moneyAmount, storefrontSchema, ulidId } from '../v5-core';
import { customers } from './customers';

/**
 * Wallet Transactions Table (Ledger)
 * Alignment: UUID -> TIMESTAMPTZ -> MONEY -> TEXT
 */
export const walletTransactions = storefrontSchema.table(
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
    // C-2 Fix: Explicit currency column as single source of truth.
    // Prevents currency confusion by making the wallet's denomination explicit.
    currency: text('currency').notNull().default('SAR'),
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
    // C-2 Fix: Currency consistency — prevents depositing USD into a SAR wallet.
    // All three values (amount, balance_after, currency column) must agree.
    walletCurrencyCheck: check(
      'ck_wallet_currency_consistent',
      sql`
        "currency" = ("amount"->>'currency')
        AND "currency" = ("balance_after"->>'currency')
      `
    ),
  })
);

export type WalletTransaction = typeof walletTransactions.$inferSelect;
