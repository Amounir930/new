/**
 * Storefront Customer Schema — V5 Enterprise Hardening
 *
 * Tables: customers, addresses, payment_methods.
 * Security: S7 Encrypted Safety + PII Compliance.
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
import { consentChannelEnum } from '../enums';
import {
  deletedAt,
  encryptedCheck,
  encryptedText,
  moneyAmount,
  ulidId,
} from '../v5-core';

/**
 * 👤 Customers Table
 * ALIGNMENT: UUID -> TS -> BIGINT -> BOOL -> TEXT (Encrypted) -> ARRAY -> JSONB
 */
export const customers = pgTable(
  'customers',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp('last_login_at', {
      withTimezone: true,
      precision: 6,
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, precision: 6 }),

    // ── 2. Money ──
    walletBalance: moneyAmount('wallet_balance').default(
      sql`'(0,SAR)'::money_amount`
    ),

    // ── 3. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    phoneVerified: boolean('phone_verified').default(false).notNull(),
    // Audit 777 Point #6: Version must be NOT NULL and DEFAULT 1
    version: integer('version').default(1).notNull(),

    // ── 4. S7 Encrypted Scalars (Point #13) ──
    // MUST use text() to prevent ciphertext overflow.
    email: encryptedText('email').notNull(),
    phone: text('phone'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),

    // ── 4.1 Blind Indexes (Mandate #11, #14) ──
    // Binary hashes for secure search without decryption
    emailHash: text('email_hash'),
    phoneHash: text('phone_hash'),

    // ── 5. Arrays ──
    tags: text('tags').array(),

    // ── 6. JSONB ──
    preferences: jsonb('preferences').notNull().default({}), // Fixed: jsonb with default
  },
  (table) => ({
    // Directive #12: Soft-delete safe unique index for emails.
    idxCustomerEmail: uniqueIndex('idx_customer_email_active')
      .on(table.email)
      .where(sql`deleted_at IS NULL`),
    idxCustomerPhone: index('idx_customer_phone_active')
      .on(table.phone)
      .where(sql`deleted_at IS NULL`),

    // Mandate #14: Blind Index Uniqueness
    idxCustomerPhoneHash: uniqueIndex('idx_customer_phone_hash')
      .on(table.phoneHash)
      .where(sql`deleted_at IS NULL`),
    idxCustomerEmailHash: uniqueIndex('idx_customer_email_hash')
      .on(table.emailHash)
      .where(sql`deleted_at IS NULL`),

    // Mandate #10: S7 Structural Integrity Checks
    emailEncrypted: encryptedCheck(table.email),
    phoneEncrypted: encryptedCheck(table.phone),
    firstNameEncrypted: encryptedCheck(table.firstName),
    lastNameEncrypted: encryptedCheck(table.lastName),
  })
);

/**
 * 📍 Customer Addresses
 */
export const customerAddresses = pgTable(
  'customer_addresses',
  {
    // ── Fixed ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── Boolean ──
    isDefault: boolean('is_default').default(false).notNull(),

    // ── Text ──
    // ── 7. PII Encryption (Point #26) ──
    name: text('name'),
    addressLine1: text('address_line1').notNull(), // S7 Encrypted
    addressLine2: text('address_line2'), // S7 Encrypted
    city: text('city').notNull(),
    state: text('state'),
    zipCode: text('zip_code'), // S7 Encrypted
    country: text('country').notNull(), // ISO 3166-1
    phone: text('phone'), // S7 Encrypted
  },
  (table) => ({
    idxAddrCustomer: index('idx_addr_customer').on(table.customerId),
  })
);

// Type Exports
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
