/**
 * Storefront Supply Chain Schema — V5 Enterprise Hardening
 *
 * Tables: suppliers, purchase_orders, inventory_transfers.
 * Logic: Full Traceability + RESTRICT deletes.
 */

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { moneyAmount, ulidId } from '../v5-core';
import { storeLocations } from './locations';
import { productVariants } from './products';

/**
 * 🏭 Suppliers
 */
export const suppliers = pgTable('suppliers', {
  // ── 1. Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),

  // ── 2. Scalar ──
  name: text('name').notNull(),
  contactName: text('contact_name'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
});

/**
 * 📝 Purchase Orders
 */
export const purchaseOrders = pgTable('purchase_orders', {
  // ── 1. Fixed ──
  id: ulidId(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  destinationLocationId: uuid('location_id')
    .notNull()
    .references(() => storeLocations.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  expectedAt: timestamp('expected_at', { withTimezone: true, precision: 6 }),

  // ── 2. Money ──
  totalAmount: moneyAmount('total_amount').notNull(),

  // ── 3. Text ──
  status: text('status').notNull().default('draft'), // draft, ordered, received, cancelled
});

/**
 * 📦 Purchase Order Items
 */
export const purchaseOrderItems = pgTable(
  'purchase_order_items',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    purchaseOrderId: uuid('order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'restrict' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id),

    // ── 2. Money ──
    unitCost: moneyAmount('unit_cost').notNull(),

    // ── 3. Integer ──
    quantityOrdered: integer('quantity_ordered').notNull(),
    quantityReceived: integer('quantity_received').default(0).notNull(),
  },
  (table) => ({
    qtyPositive: check('qty_positive', sql`${table.quantityOrdered} > 0`),
  })
);

/**
 * 🚚 Inventory Transfers
 */
export const inventoryTransfers = pgTable('inventory_transfers', {
  // ── 1. Fixed ──
  id: ulidId(),
  originLocationId: uuid('origin_id')
    .notNull()
    .references(() => storeLocations.id, { onDelete: 'restrict' }),
  destinationLocationId: uuid('destination_id')
    .notNull()
    .references(() => storeLocations.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  shippedAt: timestamp('shipped_at', { withTimezone: true, precision: 6 }),
  receivedAt: timestamp('received_at', { withTimezone: true, precision: 6 }),

  // ── 2. Text ──
  status: text('status').notNull().default('pending'),
});

// Type Exports
export type Supplier = typeof suppliers.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InventoryTransfer = typeof inventoryTransfers.$inferSelect;
