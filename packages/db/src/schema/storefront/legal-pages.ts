/**
 * Storefront Legal Pages Schema — V5 Enterprise Hardening
 *
 * Per-tenant legal content pages (Privacy Policy, Terms of Service, etc.)
 * Plan.md Store-#28: "Content pulled from tenant's `legal_pages` table (editable in Admin)."
 *
 * Gap-2 Fix: Distinct from `storefront.pages` (generic CMS pages).
 * Legal pages have: enforced page types, versioning, and unique constraint
 * per (tenant, type) to prevent duplicates.
 *
 * @module @apex/db/schema/storefront/legal-pages
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';

/**
 * Legal page types — matches the 5 standard legal pages
 * required for e-commerce compliance (GDPR, KSA consumer law, etc.)
 */
const LEGAL_PAGE_TYPES = [
  'privacy_policy',
  'terms_of_service',
  'shipping_policy',
  'return_policy',
  'cookie_policy',
] as const;

/**
 * Legal Pages Table
 * Alignment: UUID → TIMESTAMPTZ → INT → BOOL → TEXT → JSONB
 */
export const legalPages = storefrontSchema.table(
  'legal_pages',
  {
    // ── 1. Fixed (Alignment) ──
    id: ulidId(),
    tenantId: text('tenant_id').notNull(), // logical ref — no cross-schema FK (Directive #3)
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // ── 2. Integer ──
    // Version counter for audit trail of legal document changes
    version: integer('version').notNull().default(1),

    // ── 3. Boolean ──
    isPublished: boolean('is_published').default(false).notNull(),

    // ── 4. Text ──
    // pageType is constrained by CHECK — only valid legal page types accepted
    pageType: text('page_type').notNull(), // See LEGAL_PAGE_TYPES above
    lastEditedBy: text('last_edited_by'), // Staff member ID

    // ── 5. JSONB (i18n) ──
    title: jsonb('title').notNull(), // { ar: 'سياسة الخصوصية', en: 'Privacy Policy' }
    content: jsonb('content').notNull(), // Rich text JSON (Lexical format)
  },
  (table) => ({
    // One legal page per type per tenant
    uqLegalPageType: uniqueIndex('uq_legal_page_type').on(
      table.tenantId,
      table.pageType
    ),
    idxLegalTenant: index('idx_legal_tenant').on(table.tenantId),
    idxLegalPublished: index('idx_legal_published').on(table.isPublished),
    // Enforce valid page types at DB level
    pageTypeCheck: check(
      'ck_legal_page_type',
      sql`"page_type" IN ('privacy_policy', 'terms_of_service', 'shipping_policy', 'return_policy', 'cookie_policy')`
    ),
    // Version must always be positive
    versionCheck: check('ck_legal_version_positive', sql`"version" > 0`),
  })
);

// ─── Type Exports ─────────────────────────────────────────────
export type LegalPage = typeof legalPages.$inferSelect;
export type NewLegalPage = typeof legalPages.$inferInsert;
export type LegalPageType = (typeof LEGAL_PAGE_TYPES)[number];
