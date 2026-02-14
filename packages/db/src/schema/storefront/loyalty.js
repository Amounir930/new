/**
 * Loyalty System Schema
 *
 * Tables for loyalty rules and points management.
 *
 * @module @apex/db/schema/storefront/loyalty
 */
import { integer, jsonb, pgTable, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Loyalty Rules Table
 */
export const loyaltyRules = pgTable('loyalty_rules', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    pointsPerCurrency: integer('points_per_currency').default(1),
    minRedeemPoints: integer('min_redeem_points').default(100),
    pointsExpiryDays: integer('points_expiry_days'), // NULL = never
    // Reward mapping [{ points: 500, couponCode: 'LOYAL50' }]
    rewards: jsonb('rewards').default([]),
    isActive: integer('is_active').default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
//# sourceMappingURL=loyalty.js.map