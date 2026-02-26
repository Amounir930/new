/**
 * Storefront Configuration Schema — V5
 *
 * Tenant config and navigation tables for templates.
 *
 * @module @apex/db/schema/storefront/config
 */

import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';

/**
 * Tenant Config Table (key-value storage)
 */
export const tenantConfig = storefrontSchema.table('tenant_config', {
  key: text('key').primaryKey(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  value: jsonb('value').notNull(),
});

/**
 * Menu Items Table (navigation)
 * Column alignment: UUID → TIMESTAMPTZ → INT → BOOLEAN → TEXT
 */
export const menuItems = storefrontSchema.table(
  'menu_items',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    parentId: uuid('parent_id').references((): AnyPgColumn => menuItems.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Integer ──
    order: integer('order').default(0),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar ──
    menuType: text('menu_type').notNull(),
    label: text('label').notNull(),
    url: text('url'),
    icon: text('icon'),
  },
  (table) => ({
    idxMenuItemsType: index('idx_menu_items_type').on(table.menuType),
    idxMenuItemsParent: index('idx_menu_items_parent').on(table.parentId),
    idxMenuItemsActive: index('idx_menu_items_active').on(table.isActive),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type TenantConfig = typeof tenantConfig.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
