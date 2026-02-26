/**
 * Storefront Ecosystem Schema — V5 Enterprise Hardening
 *
 * Tables: outbox_events, webhooks, affiliate_plans.
 * Performance: Event Sourcing Tuning + Range Partitioning.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
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
  affiliateStatusEnum,
  affiliateTransactionStatusEnum,
  b2bCompanyStatusEnum,
  outboxStatusEnum,
} from '../enums';
import {
  deletedAt,
  encryptedCheck,
  encryptedText,
  microAmount,
  moneyAmount,
  storefrontSchema,
  ulidId,
} from '../v5-core';

/**
 * 📤 Outbox Events (Event Sourcing / Reliable Integration)
 * ARCHITECTURE: Partitioned by Range (created_at).
 * TUNING: High-throughput fillfactor 70.
 * ALIGNMENT: UUID -> TIMESTAMPTZ -> ENUM -> TEXT -> JSONB
 */
export const outboxEvents = storefrontSchema.table(
  'outbox_events',
  {
    // ── 1. Fixed (Aligned) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Enum (4 bytes) ──
    status: outboxStatusEnum('status').default('pending').notNull(),

    // ── 3. Scalar (Varchar/Text) ──
    aggregateId: text('aggregate_id').notNull(),
    aggregateType: text('aggregate_type').notNull(),
    eventType: text('event_type').notNull(),

    // ── 4. JSONB (Variable) ──
    payload: jsonb('payload').notNull(),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    // Decision #16: BRIN for high-volume append stream.
    idxOutboxCreatedBrin: index('idx_outbox_created_brin').using(
      'brin',
      table.createdAt
    ),
    idxOutboxStatus: index('idx_outbox_status_pending')
      .on(table.status)
      .where(sql`status = 'pending'`),
    // Decision #20: FILLFACTOR 70 for high write concurrency
    with: { fillfactor: 70 },
  })
);

/**
 * 🤝 B2B Features
 */
export const b2bCompanies = storefrontSchema.table('b2b_companies', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, precision: 6 }),

  // ── 2. Enum ──
  status: b2bCompanyStatusEnum('status').default('active').notNull(),

  // ── 3. Text ──
  name: text('name').notNull(),
  taxRegistrationNumber: text('tax_registration_number'),
  billingEmail: text('billing_email'),
});

export const b2bPricingTiers = storefrontSchema.table(
  'b2b_pricing_tiers',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => b2bCompanies.id),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Integer ──
    discountBasisPoints: integer('discount_basis_points').notNull(),

    // ── 3. Text ──
    name: text('name').notNull(),
    productId: uuid('product_id').notNull(),
    minQuantity: integer('min_quantity').default(0).notNull(),
    maxQuantity: integer('max_quantity'), // Nullable for infinite upper bound
  },
  (table) => ({
    // Fatal Mandate #22: B2B Tier Collision Prevention
    // Uses EXCLUDE USING GIST with int4range ensuring overlap protection.
    // Supports open-ended ranges [min, ) for infinity via NULL max_quantity.
    idxB2BTierOverlap: index('idx_b2b_tier_collision').using(
      'gist',
      sql`int4range(${table.minQuantity}, COALESCE(${table.maxQuantity}, 2147483647), '[]')`
    ),
  })
);

export const b2bUsers = storefrontSchema.table('b2b_users', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id').notNull(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => b2bCompanies.id),
  userId: uuid('user_id').notNull(), // Link to auth user
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),

  // ── 2. Money (Composite) ──
  unitPrice: moneyAmount('unit_price')
    .notNull()
    .default(sql`'(0,SAR)'::money_amount`),

  // ── 3. Text ──
  role: text('role').notNull().default('member'), // admin, member
});

/**
 * 🪝 Webhooks
 * ALIGNMENT: UUID -> TS -> INT -> TEXT -> JSONB
 */
export const webhooks = storefrontSchema.table('webhooks', {
  id: ulidId(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),

  // Fatal Mandate #28: Versioned Signing Keys
  keyVersion: integer('key_version').default(1).notNull(),

  url: text('url').notNull(),
  eventTypes: text('event_types').array().default([]).notNull(),
  secret: text('secret'), // S7 Encrypted ciphertext
  isActive: boolean('is_active').default(true).notNull(),
});

/**
 * 📣 Affiliate Program
 */
export const affiliatePartners = storefrontSchema.table(
  'affiliate_partners',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Enum ──
    status: affiliateStatusEnum('status').default('pending').notNull(),

    // ── 3. Scalar ──
    code: text('code').notNull().unique(),
    // A-03 Fix: Encrypted PII + blind index for searchable lookups.
    email: encryptedText('email').notNull(),
    emailHash: text('email_hash'), // HMAC-SHA256 blind index for DB-level search
  },
  (table) => ({
    idxAffiliateEmailHash: index('idx_affiliate_email_hash').on(
      table.emailHash
    ),
    // A-03 Fix: Enforce S7 ciphertext structure
    emailEncrypted: encryptedCheck(table.email),
  })
);

export const affiliateTransactions = storefrontSchema.table(
  'affiliate_transactions',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => affiliatePartners.id),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Money ──
    amount: moneyAmount('amount').notNull(),

    // ── 3. Enum ──
    status: affiliateTransactionStatusEnum('status')
      .default('pending')
      .notNull(),

    // ── 4. Text ──
    referenceOrderId: text('reference_order_id'),
  },
  (table) => ({
    idxAffTransCreatedBrin: index('idx_aff_trans_created_brin').using(
      'brin',
      table.createdAt
    ),
  })
);

// Type Exports
export type OutboxEvent = typeof outboxEvents.$inferSelect;
export type B2BCompany = typeof b2bCompanies.$inferSelect;
export type B2BPricingTier = typeof b2bPricingTiers.$inferSelect;
export type AffiliatePartner = typeof affiliatePartners.$inferSelect;
export type AffiliateTransaction = typeof affiliateTransactions.$inferSelect;
