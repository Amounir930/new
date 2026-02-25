/**
 * Storefront Cart Schema — V5
 *
 * Cart persistence table (primary storage is Redis).
 * Composite money, ULIDs, and clean alignment.
 *
 * @module @apex/db/schema/storefront/cart
 */

import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { moneyAmount, ulidId } from '../v5-core';
import { customers } from './customers';

/**
 * Carts Table — FILLFACTOR 80% (high-update)
 */
export const carts = pgTable(
  'carts',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    customerId: uuid('customer_id').references(() => customers.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // ── Money (Composite) ──
    subtotal: moneyAmount('subtotal'),

    // ── Scalar ──
    sessionId: text('session_id'),

    // ── JSONB (Decision #5) ──
    items: jsonb('items').notNull(),
    appliedCoupons: jsonb('applied_coupons'),
  },
  (table) => ({
    idxCartsCustomer: index('idx_carts_customer').on(table.customerId),
    idxCartsSession: index('idx_carts_session').on(table.sessionId),
    idxCartsExpires: index('idx_carts_expires').on(table.expiresAt),
    with: { fillfactor: 80 },
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type Cart = typeof customers.$inferSelect;
export type NewCart = typeof customers.$inferInsert;
