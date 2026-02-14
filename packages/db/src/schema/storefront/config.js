/**
 * Storefront Configuration Schema
 *
 * Tenant config and navigation tables for templates.
 *
 * @module @apex/db/schema/storefront/config
 */
import { boolean, index, integer, jsonb, pgTable, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Tenant Config Table (key-value storage)
 */
export const tenantConfig = pgTable('tenant_config', {
    key: varchar('key', { length: 100 }).primaryKey(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
/**
 * Menu Items Table (navigation)
 */
export const menuItems = pgTable('menu_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    menuType: varchar('menu_type', { length: 20 }).notNull(), // header, footer, mobile
    parentId: uuid('parent_id').references(() => menuItems.id), // Self-reference for nested menus
    label: varchar('label', { length: 100 }).notNull(),
    url: varchar('url', { length: 255 }),
    icon: varchar('icon', { length: 50 }),
    order: integer('order').default(0),
    isActive: boolean('is_active').default(true),
}, (table) => ({
    idxMenuItemsType: index('idx_menu_items_type').on(table.menuType),
    idxMenuItemsParent: index('idx_menu_items_parent').on(table.parentId),
    idxMenuItemsActive: index('idx_menu_items_active').on(table.isActive),
}));
//# sourceMappingURL=config.js.map