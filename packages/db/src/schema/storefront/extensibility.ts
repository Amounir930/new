/**
 * Platform Extensibility Schema — V5 Enterprise Hardening
 *
 * Tables: app_installations, webhook_subscriptions.
 * Logic: Third-party ecosystem hooks.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { bytea, storefrontSchema, ulidId } from '../v5-core';

/**
 * 🧩 App Installations (Third-party integrations)
 */
export const appInstallations = storefrontSchema.table('app_installations', {
  // ── 1. Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // ── 2. Text ──
  appKey: text('app_key').notNull(),
  accessToken: text('access_token').notNull(), // S7 Encrypted
  scope: text('scope').notNull(),

  // ── 3. JSONB ──
  settings: jsonb('settings').default({}),
});

/**
 * ⚓ Webhook Subscriptions
 */
export const webhookSubscriptions = storefrontSchema.table(
  'webhook_subscriptions',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // ── 2. Boolean ──
    isActive: boolean('is_active').default(true).notNull(),

    // ── 3. Scalar ──
    topic: text('topic').notNull(), // order.created, product.updated
    address: text('address').notNull(),
    format: text('format').default('json'),

    // Directive #19: Webhook Payload Tampering Protection
    secret: bytea('secret').notNull(),
  }
);

// Type Exports
export type AppInstallation = typeof appInstallations.$inferSelect;
export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
