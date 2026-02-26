/**
 * Referral Program Schema — V5
 *
 * S7: Referral tracking with composite money rewards.
 * FK: RESTRICT on referrer (preserve reward history).
 *
 * @module @apex/db/schema/storefront/referrals
 */

import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { moneyAmount, storefrontSchema, ulidId } from '../v5-core';
import { customers } from './customers';

/**
 * Referrals Table
 * Column alignment: UUID → TIMESTAMPTZ → MONEY → BOOLEAN → TEXT
 */
export const referrals = storefrontSchema.table(
  'referrals',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    referrerId: uuid('referrer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    referredId: uuid('referred_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    convertedAt: timestamp('converted_at', { withTimezone: true }),

    // ── Money (Composite) ──
    rewardAmount: moneyAmount('reward_amount'),

    // ── Boolean ──
    isRewardApplied: boolean('is_reward_applied').default(false),

    // ── Scalar ──
    referralCode: text('referral_code').notNull(),
    status: text('status').default('pending'),
  },
  (table) => ({
    idxReferralCode: index('idx_referral_code').on(table.referralCode),
    idxReferralReferrer: index('idx_referral_referrer').on(table.referrerId),
  })
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
