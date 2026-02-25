/**
 * Storefront Inventory Schema — V5 Enterprise Hardening
 *
 * Tables: inventory_levels, movements, reservations.
 * Performance: FILLFACTOR 80 + Optimistic Locking.
 */

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { inventoryMovementTypeEnum, reservationStatusEnum } from '../enums';
import { ulidId } from '../v5-core';
import { storeLocations } from './locations';
import { productVariants } from './products';

/**
 * 🏢 Inventory Levels
 * TUNING: High-concurrency update performance.
 * ALIGNMENT: UUID -> TIMESTAMPTZ -> BIGINT -> INTEGER -> BOOLEAN -> TEXT
 */
export const inventoryLevels = pgTable(
  'inventory_levels',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    locationId: uuid('location_id')
      .notNull()
      .references(() => storeLocations.id, { onDelete: 'restrict' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),

    // ── 2. Timestamps ──
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 3. Integer (Atomic Counters + Concurrency) ──
    available: integer('available').default(0).notNull(),
    reserved: integer('reserved').default(0).notNull(),
    incoming: integer('incoming').default(0).notNull(),

    // Decision #4: Optimistic Locking
    version: integer('version').default(1).notNull(),
  },
  (table) => ({
    idxInvLevelsUnique: uniqueIndex('uq_location_variant').on(
      table.locationId,
      table.variantId
    ),
    // Point #20: FILLFACTOR 80
    with: { fillfactor: 80 },
  })
);

/**
 * 📜 Inventory Movements (Audit Ledger)
 */
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    // ── Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => storeLocations.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── Integer ──
    quantity: integer('quantity').notNull(),

    // ── 3. Enum ──
    type: inventoryMovementTypeEnum('type').notNull(),

    // ── 4. Text ──
    reason: text('reason'),
    referenceId: text('reference_id'),
  },
  (table) => ({
    qtyPos: check('qty_positive', sql`"quantity" > 0`),
    idxInvMovementsCreated: index('idx_inv_mov_created_brin').using(
      'brin',
      table.createdAt
    ),
    idxInvMovementsVariant: index('idx_inv_mov_variant').on(table.variantId),
  })
);

// Type Exports
export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;

/**
 * ⚡ Inventory Reservations (Flash Sales)
 * Swept by pg_cron (Mandate #16)
 */
export const inventoryReservations = pgTable(
  'inventory_reservations',
  {
    // ── Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      precision: 6,
    }).notNull(),

    // ── Integer ──
    quantity: integer('quantity').notNull(),

    // ── Scalar ──
    sessionId: text('session_id').notNull(),
  },
  (table) => ({
    idxReservationExpires: index('idx_reservation_expires').on(table.expiresAt),
  })
);

export type InventoryReservation = typeof inventoryReservations.$inferSelect;
