/**
 * Storefront Coupon Schema
 *
 * Discount coupons table for templates.
 *
 * @module @apex/db/schema/storefront/coupons
 */
import { boolean, decimal, index, integer, pgTable, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Coupons Table
 */
export const coupons = pgTable('coupons', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 50 }).notNull().unique(), // e.g., SUMMER20
    type: varchar('type', { length: 20 }).notNull(), // percentage, fixed
    value: decimal('value', { precision: 10, scale: 2 }).notNull(),
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
    maxUses: integer('max_uses'), // NULL = unlimited
    usedCount: integer('used_count').default(0),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true),
}, (table) => ({
    idxCouponsCode: index('idx_coupons_code').on(table.code),
    idxCouponsActive: index('idx_coupons_active').on(table.isActive),
}));
//# sourceMappingURL=coupons.js.map