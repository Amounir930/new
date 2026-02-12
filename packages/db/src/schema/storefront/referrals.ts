/**
 * Referral Program Schema
 *
 * Tables for invitation tracking and referral rewards.
 *
 * @module @apex/db/schema/storefront/referrals
 */

import {
  boolean,
  decimal,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { customers } from './customers';

/**
 * Referrals Table
 */
export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),

  referrerId: uuid('referrer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),

  referredId: uuid('referred_id').references(() => customers.id, {
    onDelete: 'set null',
  }), // Customer who signed up

  referralCode: varchar('referral_code', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, completed, expired

  rewardAmount: decimal('reward_amount', { precision: 10, scale: 2 }),
  isRewardApplied: boolean('is_reward_applied').default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/**
 * Type Exports
 */
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
