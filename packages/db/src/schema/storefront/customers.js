/**
 * Storefront Customer Schema
 *
 * Customer and address tables for templates.
 *
 * @module @apex/db/schema/storefront/customers
 */
import { boolean, char, decimal, index, integer, pgTable, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core';
/**
 * Customers Table
 */
export const customers = pgTable('customers', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(), // S7: Encrypted JSON { iv, content, tag }
    emailHash: char('email_hash', { length: 64 }).notNull().unique(), // S7: Blind Index (SHA-256)
    passwordHash: text('password_hash'), // Argon2id
    firstName: text('first_name'), // S7: Encrypted JSON
    lastName: text('last_name'), // S7: Encrypted JSON
    phone: text('phone'), // S7: Encrypted JSON
    phoneHash: char('phone_hash', { length: 64 }), // S7: Blind Index (SHA-256)
    avatarUrl: text('avatar_url'),
    isVerified: boolean('is_verified').default(false),
    // Loyalty & Wallet
    loyaltyPoints: integer('loyalty_points').default(0),
    walletBalance: decimal('wallet_balance', {
        precision: 10,
        scale: 2,
    }).default('0'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    idxCustomersEmailHash: index('idx_customers_email_hash').on(table.emailHash),
}));
/**
 * Customer Addresses Table
 */
export const customerAddresses = pgTable('customer_addresses', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
        .notNull()
        .references(() => customers.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 50 }), // "Home", "Work"
    name: varchar('name', { length: 255 }).notNull(), // Recipient name
    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: char('country', { length: 2 }).notNull(), // ISO 3166-1 alpha-2
    phone: varchar('phone', { length: 20 }), // S7: Encrypted
    isDefault: boolean('is_default').default(false),
}, (table) => ({
    idxCustomerAddressesCustomer: index('idx_customer_addresses_customer').on(table.customerId),
}));
//# sourceMappingURL=customers.js.map