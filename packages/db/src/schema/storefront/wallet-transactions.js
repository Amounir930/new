/**
 * Wallet Transactions Schema
 *
 * S7: Forensic financial logging for customer wallets.
 *
 * @module @apex/db/schema/storefront/wallet-transactions
 */
import { decimal, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { orders } from './orders';
/**
 * Wallet Transactions Table
 */
export const walletTransactions = pgTable('wallet_transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
        .notNull()
        .references(() => customers.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // credit, debit
    reason: varchar('reason', { length: 100 }).notNull(), // refund, topup, purchase, promo
    description: text('description'),
    orderId: uuid('order_id').references(() => orders.id), // For purchase/refund links
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
//# sourceMappingURL=wallet-transactions.js.map