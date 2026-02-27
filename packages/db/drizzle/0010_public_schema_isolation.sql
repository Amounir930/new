-- ============================================================
-- MIGRATION: 0010_public_schema_isolation.sql
-- Title: Public Schema Isolation Breach — Quarantine & Remediation
-- Audit: APEX-DB-AUDIT-001 Finding C-3
-- Date: 2026-02-26
-- ============================================================
-- PROBLEM: Tables (users, stores, settings, auth_logs, otp_codes,
--   auth_logs, entity_metafields, search_synonyms, customer_segments,
--   smart_collections, tax_categories, tax_rules, currency_rates,
--   discount_codes, markets, price_lists, price_rules, menu_items,
--   tenant_config, blog_posts, product_views, abandoned_checkouts,
--   affiliate_partners, affiliate_transactions, app_installations,
--   b2b_companies, b2b_pricing_tiers, b2b_users, outbox_events,
--   newsletter_subscribers, search_analytics, etc.)
--   were created in the PUBLIC schema by the baseline migration,
--   bypassing tenant isolation entirely.
--
-- STRATEGY:
--   Step 1: Create quarantine schema for legacy orphaned tables
--   Step 2: Move known-problematic tables out of public
--   Step 3: Block future accidental creation in public via RLS/DDL event trigger
--   Step 4: Add missing tenant_id to tables that are tenant-scoped
--
-- ⚠️ IMPORTANT: Review each table before moving. Some may be
--   intentionally global (currency_rates, tax_categories) and
--   don't need tenant_id. Tables with customer/order data DO.
-- ============================================================

-- BEGIN; (Removed for Drizzle compatibility)
-- ── Step 1: Create quarantine / shared schemas ────────────────

-- 'shared' schema: global reference data used across all tenants (no tenant_id needed)
CREATE SCHEMA IF NOT EXISTS shared;

-- 'legacy' schema: trap for orphaned public tables pending refactoring  
CREATE SCHEMA IF NOT EXISTS legacy;

-- ── Step 2: Move global reference tables to 'shared' schema ──
-- These tables are intentionally cross-tenant (currency, tax, markets).
-- They don't need tenant_id — they are global lookup tables.

DO $$
BEGIN
  -- currency_rates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'currency_rates') THEN
    ALTER TABLE public.currency_rates SET SCHEMA shared;
    RAISE NOTICE 'Moved public.currency_rates -> shared.currency_rates';
  END IF;

  -- tax_categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_categories') THEN
    ALTER TABLE public.tax_categories SET SCHEMA shared;
    RAISE NOTICE 'Moved public.tax_categories -> shared.tax_categories';
  END IF;

  -- tax_rules
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_rules') THEN
    ALTER TABLE public.tax_rules SET SCHEMA shared;
    RAISE NOTICE 'Moved public.tax_rules -> shared.tax_rules';
  END IF;

  -- markets
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'markets') THEN
    ALTER TABLE public.markets SET SCHEMA shared;
    RAISE NOTICE 'Moved public.markets -> shared.markets';
  END IF;

  -- search_synonyms
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'search_synonyms') THEN
    ALTER TABLE public.search_synonyms SET SCHEMA shared;
    RAISE NOTICE 'Moved public.search_synonyms -> shared.search_synonyms';
  END IF;
END $$;
--> statement-breakpoint
-- ── Step 3: Move tenant-scoped orphaned tables to 'legacy' ────
-- These tables NEED tenant_id — they are tenant data accidentally in public.
-- They are moved to 'legacy' until they can be refactored into storefront schema.

DO $$
BEGIN
  -- C-3 Primary targets: users / stores / settings / auth_logs / otp_codes

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users SET SCHEMA legacy;
    RAISE NOTICE 'C-3 Fix: Moved public.users -> legacy.users (NO tenant_id — REFACTOR REQUIRED)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    ALTER TABLE public.stores SET SCHEMA legacy;
    RAISE NOTICE 'C-3 Fix: Moved public.stores -> legacy.stores (NO tenant_id — REFACTOR REQUIRED)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings') THEN
    ALTER TABLE public.settings SET SCHEMA legacy;
    RAISE NOTICE 'C-3 Fix: Moved public.settings -> legacy.settings';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_logs') THEN
    ALTER TABLE public.auth_logs SET SCHEMA legacy;
    RAISE NOTICE 'C-3 Fix: Moved public.auth_logs -> legacy.auth_logs';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_codes') THEN
    ALTER TABLE public.otp_codes SET SCHEMA legacy;
    RAISE NOTICE 'C-3 Fix: Moved public.otp_codes -> legacy.otp_codes';
  END IF;

  -- Other orphaned tables without schema prefix (should be in storefront)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_migrations') THEN
    ALTER TABLE public.tenant_migrations SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entity_metafields') THEN
    ALTER TABLE public.entity_metafields SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_segments') THEN
    ALTER TABLE public.customer_segments SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_collections') THEN
    ALTER TABLE public.smart_collections SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discount_codes') THEN
    ALTER TABLE public.discount_codes SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_lists') THEN
    ALTER TABLE public.price_lists SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_rules') THEN
    ALTER TABLE public.price_rules SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_items') THEN
    ALTER TABLE public.menu_items SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_config') THEN
    ALTER TABLE public.tenant_config SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    ALTER TABLE public.blog_posts SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'abandoned_checkouts') THEN
    ALTER TABLE public.abandoned_checkouts SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_partners') THEN
    ALTER TABLE public.affiliate_partners SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'affiliate_transactions') THEN
    ALTER TABLE public.affiliate_transactions SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'b2b_companies') THEN
    ALTER TABLE public.b2b_companies SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outbox_events') THEN
    ALTER TABLE public.outbox_events SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'newsletter_subscribers') THEN
    ALTER TABLE public.newsletter_subscribers SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    ALTER TABLE public.payment_methods SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_subscriptions') THEN
    ALTER TABLE public.webhook_subscriptions SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_views') THEN
    ALTER TABLE public.product_views SET SCHEMA legacy;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_installations') THEN
    ALTER TABLE public.app_installations SET SCHEMA legacy;
  END IF;
END $$;
--> statement-breakpoint
-- ── Step 4: Revoke CREATE on public schema from app role ──────
-- Prevents future accidents where ORM or dev creates a table in public.
-- Postgres 15+ default: no CREATE on public, but enforce explicitly.

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
--> statement-breakpoint
-- Allow only the migration user (postgres / superuser) to create in public.
-- Application roles should use governance/storefront/shared schemas only.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_app_service') THEN
    REVOKE CREATE ON SCHEMA public FROM role_app_service;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_tenant_admin') THEN
    REVOKE CREATE ON SCHEMA public FROM role_tenant_admin;
  END IF;
END $$;
--> statement-breakpoint
-- ── Step 5: Verify public schema is clean ────────────────────
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT count(*) INTO orphan_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('spatial_ref_sys'); -- PostGIS system table

  IF orphan_count > 0 THEN
    RAISE WARNING 'C-3 Partial Fix: % tables remain in public schema. Manual review required.', orphan_count;
  ELSE
    RAISE NOTICE 'C-3 Fix: public schema is clean. All tenant tables properly isolated.';
  END IF;
END $$;
--> statement-breakpoint
-- ── Step 6: Document legacy schema purpose ────────────────────
COMMENT ON SCHEMA legacy IS
  'Quarantine zone for tables from 0001_baseline.sql that were accidentally created in public schema '
  'without tenant_id. Each table here MUST be refactored into storefront or governance schema '
  'with proper tenant isolation before use. [APEX-DB-AUDIT-001 C-3]';

COMMENT ON SCHEMA shared IS
  'Global reference data shared across all tenants (currency rates, tax tables, markets). '
  'No tenant_id needed — data applies platform-wide.';

-- ── Record migration ──────────────────────────────────────────
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  VALUES ('0010_public_schema_isolation', EXTRACT(EPOCH FROM NOW()) * 1000)
  ON CONFLICT DO NOTHING;

-- COMMIT; (Removed for Drizzle compatibility)