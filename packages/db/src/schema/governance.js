/**
 * Multi-Tenant Governance Schema (Rule 2: S2 Compliance)
 *
 * Centralized tables for managing tenant limits, quotas, and feature access.
 * These tables live in the PUBLIC schema for Super Admin master control.
 *
 * @module @apex/db/schema/governance
 */
import { boolean, decimal, integer, jsonb, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
import { tenants } from '../schema'; // Reference the main tenants table
/**
 * Subscription Plans Table
 * Defines the available tiers (Free, Pro, Enterprise, etc.)
 */
export const subscriptionPlans = pgTable('subscription_plans', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 50 }).notNull().unique(), // e.g., 'free', 'basic', 'pro'
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).default('0'),
    currency: varchar('currency', { length: 3 }).default('USD'),
    // Default Quotas for this plan
    defaultMaxProducts: integer('default_max_products').default(50),
    defaultMaxOrders: integer('default_max_orders').default(100), // per month
    defaultMaxPages: integer('default_max_pages').default(5),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
/**
 * Tenant Quotas Table
 * Specific overrides for individual tenants.
 */
export const tenantQuotas = pgTable('tenant_quotas', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // Overrides (if NULL, use plan defaults)
    maxProducts: integer('max_products'),
    maxOrders: integer('max_orders'),
    maxPages: integer('max_pages'),
    storageLimitGb: integer('storage_limit_gb').default(1),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
/**
 * Feature Gates Table
 * Plan-based or tenant-specific feature toggling.
 */
export const featureGates = pgTable('feature_gates', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id, {
        onDelete: 'cascade',
    }),
    planCode: varchar('plan_code', { length: 50 }), // If applied to all tenants in a plan
    featureKey: varchar('feature_key', { length: 100 }).notNull(), // e.g., 'ai_personalization', 'whatsapp_float'
    isEnabled: boolean('is_enabled').default(false),
    metadata: jsonb('metadata'), // Any extra configuration for the gate
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
/**
 * System Config Table
 * Global toggles for the entire platform (Super Admin only)
 */
export const systemConfig = pgTable('system_config', {
    key: varchar('key', { length: 100 }).primaryKey(), // e.g., 'master_maintenance', 'allow_new_registrations'
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
//# sourceMappingURL=governance.js.map