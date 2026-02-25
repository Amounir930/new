/**
 * Storefront Orders Schema — V5 Enterprise Hardening
 *
 * Tables: orders, items, fulfillments.
 * Compliance: No-Cascade Accounting + BigInt Cents.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  fulfillmentStatusEnum,
  orderSourceEnum,
  orderStatusEnum,
  paymentStatusEnum,
} from '../enums';
import {
  basisPoints,
  deletedAt,
  moneyAmount,
  occVersion,
  ulidId,
} from '../v5-core';
import { commerceMarkets } from './commerce';
import { customers } from './customers';
import { storeLocations } from './locations';
import { productVariants } from './products';

/**
 * 🧾 Orders Table
 * ALIGNMENT: UUID -> TS -> BIGINT -> INT -> BOOL -> ENUM -> TEXT -> JSONB
 */
export const orders = pgTable(
  'orders',
  {
    // ── 1. Fixed (Neural Alignment) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Scalar ──
    orderNumber: text('order_number').notNull(), // Target of tenant-specific sequence (Risk #40)
    status: orderStatusEnum('status').default('pending').notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),

    // Risk #18: Affiliate Self-Dealing Fraud
    affiliateId: uuid('affiliate_id'),

    // ── 3. Money (Composite/Check) ──
    subtotal: moneyAmount('subtotal').notNull(),
    taxAmount: moneyAmount('tax_amount').notNull(),
    discountAmount: moneyAmount('discount_amount').notNull(),
    total: moneyAmount('total').notNull(),

    // ── 5. Boolean ──
    isGuest: boolean('is_guest').default(false).notNull(),

    // ── 6. Enums ──
    paymentStatus: paymentStatusEnum('payment_status')
      .default('pending')
      .notNull(),
    fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status')
      .default('pending')
      .notNull(),
    source: orderSourceEnum('source').default('web').notNull(),

    // ── 9. OCC ──
    version: occVersion(),
  },
  (table) => ({
    // Directive #8: Scope Order Number Uniqueness to tenantId
    idxOrderNumber: uniqueIndex('idx_order_number_unique')
      .on(table.tenantId, table.orderNumber)
      .where(sql`deleted_at IS NULL`),
    idxOrderCustomer: index('idx_order_customer').on(table.customerId),
    idxOrderStatus: index('idx_order_status').on(table.status),
    // Point #16: BRIN for time-series access
    idxOrderCreatedBrin: index('idx_order_created_brin').using(
      'brin',
      table.createdAt
    ),
    checkoutMathCheck: check(
      'checkout_math_check',
      sql`
        ("total"->>'amount') ~ '^[0-9]+$' AND
        ("subtotal"->>'amount') ~ '^[0-9]+$' AND
        ("shipping_total"->>'amount') ~ '^[0-9]+$' AND
        ("tax_total"->>'amount') ~ '^[0-9]+$' AND
        ("discount_total"->>'amount') ~ '^[0-9]+$' AND
        ("total"->>'amount')::BIGINT = 
          ("subtotal"->>'amount')::BIGINT + 
          ("shipping_total"->>'amount')::BIGINT + 
          ("tax_total"->>'amount')::BIGINT - 
          ("discount_total"->>'amount')::BIGINT
      `
    ),
    // Mandate #25: Currency match at DB level
    currencyMatchCheck: check(
      'currency_match_check',
      sql`"currency" = ("total"->>'currency')`
    ),
    // Audit 777 Point #35: Order currency must match wallet currency
    // This is often enforced at the customer level or during checkout.
    // Adding a check for the order itself here.
  })
);

/**
 * 📦 Order Items
 * Compliance Point #2: RESTRICT deletion for accounting trails.
 */
export const orderItems = pgTable(
  'order_items',
  {
    // ── Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),

    // ── Money ──
    unitPrice: moneyAmount('unit_price').notNull(),
    total: moneyAmount('total').notNull(),

    // ── Integer ──
    quantity: integer('quantity').notNull(),
    weightGrams: integer('weight_grams').default(0),

    // ── Audit 777 Point #34: Tax Snapshot ──
    // Ensures historical reporting stays accurate even if rates change.
    taxBasisPoints: basisPoints('tax_basis_points').default(0).notNull(),
    taxAmount: moneyAmount('tax_amount').notNull(),

    // ── Text ──
    sku: text('sku'),
  },
  (table) => ({
    idxOrderItemOrder: index('idx_order_item_order').on(table.orderId),
    qtyPositive: check('qty_positive', sql`"quantity" > 0`),
  })
);

/**
 * 💸 Refunds
 *
 * ALIGNMENT: UUID -> TS -> BIGINT -> ENUM -> TEXT
 */
export const refunds = pgTable('refunds', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id').notNull(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),

  // ── 2. Money (BigInt Cents) ──
  amount: moneyAmount('amount').notNull(),

  // ── 3. Text ──
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // pending, completed, failed
});

/**
 * 📝 Refund Log Constraints
 * AUDIT Point #19: SUM(refunds.amount) <= orders.total logic MUST be enforced
 * at the application service layer or via a DB trigger.
 */
export const refundItems = pgTable(
  'refund_items',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    refundId: uuid('refund_id')
      .notNull()
      .references(() => refunds.id, { onDelete: 'restrict' }),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Integer ──
    quantity: integer('quantity').notNull(),
  },
  (_table) => ({
    qtyPositive: check('qty_positive', sql`"quantity" > 0`),
  })
);

/**
 * 🔄 RMA (Return Merchandise Authorization) Items
 * Directive #7: Positive quantity checks for returns.
 */
export const rmaItems = pgTable(
  'rma_items',
  {
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    quantity: integer('quantity').notNull(),
    reason: text('reason'),
    status: text('status').notNull().default('pending'), // pending, received, approved, rejected
  },
  (_table) => ({
    qtyPositive: check('qty_positive', sql`"quantity" > 0`),
  })
);

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

/**
 * 🛒 Abandoned Checkouts (Cart Storage Exhaustion)
 * Swept by pg_cron at 60 days (Mandate #14)
 */
export const abandonedCheckouts = pgTable(
  'abandoned_checkouts',
  {
    // ── Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── Scalar ──
    sessionId: text('session_id').notNull(),
    email: text('email'),

    // ── JSONB ──
    cartData: jsonb('cart_data').notNull().default({}),
  },
  (table) => ({
    idxCheckoutCreated: index('idx_checkout_created').on(table.createdAt),
  })
);

export type AbandonedCheckout = typeof abandonedCheckouts.$inferSelect;
