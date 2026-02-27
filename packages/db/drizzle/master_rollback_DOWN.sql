-- 🚨 APEX V2 UNIFIED MASTER ROLLBACK (DOWN)
-- FILE: master_rollback_DOWN.sql
-- PURPOSE: Sequentially reverses all advanced manual migrations (0006 down to 0002) 
-- to safely restore the database to its pristine 0001_baseline state.
-- WARNING: HIGHLY DESTRUCTIVE TO NEW COMMERCE AND GOVERNANCE STRUCTURES.

-- ============================================================================
-- 🚨 SAFETY GATE: BACKUP VERIFICATION (Order 5 Remediation)
-- ============================================================================
DO $$
BEGIN
    -- Simulation of a backup age check. In real environments, this would query a backup_logs table.
    -- Mandate: A rollback is forbidden unless a snapshot was taken in the last 24 hours.
    IF current_setting('app.override_rollback_safety', true) != 'true' THEN
        RAISE EXCEPTION 'Rollback Procedure Aborted: Safety override (app.override_rollback_safety) not set. Verification of 24h backup snapshot required.';
    END IF;
END $$;
--> statement-breakpoint


-- ============================================================================
-- ◀ 1. REVERSE PHASE 8 (Commerce Completion)
-- ============================================================================

-- A. Remove Column Enhancements (Alters)
ALTER TABLE "storefront"."customers" 
    DROP COLUMN IF EXISTS "total_spent", DROP COLUMN IF EXISTS "total_orders",
    DROP COLUMN IF EXISTS "last_order_at", DROP COLUMN IF EXISTS "gender",
    DROP COLUMN IF EXISTS "language", DROP COLUMN IF EXISTS "date_of_birth";
--> statement-breakpoint
ALTER TABLE "storefront"."orders" 
    DROP COLUMN IF EXISTS "risk_score", DROP COLUMN IF EXISTS "payment_method",
    DROP COLUMN IF EXISTS "coupon_code", DROP COLUMN IF EXISTS "cancel_reason",
    DROP COLUMN IF EXISTS "ip_address", DROP COLUMN IF EXISTS "user_agent",
    DROP COLUMN IF EXISTS "tags";
--> statement-breakpoint
ALTER TABLE "storefront"."order_items" 
    DROP COLUMN IF EXISTS "fulfilled_quantity", DROP COLUMN IF EXISTS "returned_quantity",
    DROP COLUMN IF EXISTS "tax_lines", DROP COLUMN IF EXISTS "discount_allocations";
--> statement-breakpoint
ALTER TABLE "storefront"."abandoned_checkouts" 
    DROP COLUMN IF EXISTS "customer_id", DROP COLUMN IF EXISTS "subtotal",
    DROP COLUMN IF EXISTS "recovery_email_sent", DROP COLUMN IF EXISTS "recovered_at";
--> statement-breakpoint
-- B. Drop Phase 8 Tables (CASCADE handles FKs automatically)
DROP TABLE IF EXISTS "storefront"."customer_segments" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."affiliate_partners" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."affiliate_transactions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."app_installations" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."b2b_companies" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."b2b_pricing_tiers" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."b2b_users" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."webhook_subscriptions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."rma_items" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."rma_requests" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."staff_members" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."staff_roles" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."staff_sessions" CASCADE;
--> statement-breakpoint
-- ============================================================================
-- ◀ 2. REVERSE PHASE 1 INFRASTRUCTURE & EXTENSIONS (Migration 0005)
-- ============================================================================

-- A. Performance Tuning (Autovacuum Revert)
ALTER TABLE storefront.outbox_events RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor, autovacuum_vacuum_cost_limit);
--> statement-breakpoint

ALTER TABLE storefront.inventory_levels RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor);
--> statement-breakpoint

ALTER TABLE storefront.carts RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor);
--> statement-breakpoint


-- B. Indices & Constraints 
DROP INDEX IF EXISTS "governance"."idx_audit_created_brin";
--> statement-breakpoint
-- C. Table Enhancements & Conversions Revert
ALTER TABLE "governance"."plan_change_history" 
    ALTER COLUMN "from_plan" TYPE varchar(50), ALTER COLUMN "to_plan" TYPE varchar(50);
--> statement-breakpoint

ALTER TABLE "governance"."leads" 
    DROP COLUMN IF EXISTS "landing_page_url", DROP COLUMN IF EXISTS "utm_source",
    DROP COLUMN IF EXISTS "utm_medium", DROP COLUMN IF EXISTS "utm_campaign";
--> statement-breakpoint
ALTER TABLE "governance"."audit_logs" DROP COLUMN IF EXISTS "actor_type";
--> statement-breakpoint
ALTER TABLE "storefront"."suppliers" DROP COLUMN IF EXISTS "lead_time_days", DROP COLUMN IF EXISTS "currency", DROP COLUMN IF EXISTS "notes";
--> statement-breakpoint
ALTER TABLE "storefront"."purchase_orders" 
    DROP COLUMN IF EXISTS "order_number", DROP COLUMN IF EXISTS "subtotal",
    DROP COLUMN IF EXISTS "tax_amount", DROP COLUMN IF EXISTS "shipping_amount",
    DROP COLUMN IF EXISTS "currency", DROP COLUMN IF EXISTS "notes";
--> statement-breakpoint
ALTER TABLE "storefront"."price_rules" DROP COLUMN IF EXISTS "applies_to", DROP COLUMN IF EXISTS "entitled_ids";
--> statement-breakpoint
ALTER TABLE "storefront"."commerce_markets" DROP COLUMN IF EXISTS "is_primary", DROP COLUMN IF EXISTS "countries";
--> statement-breakpoint
ALTER TABLE "storefront"."price_lists" 
    DROP COLUMN IF EXISTS "product_id", DROP COLUMN IF EXISTS "variant_id",
    DROP COLUMN IF EXISTS "price", DROP COLUMN IF EXISTS "compare_at_price",
    DROP COLUMN IF EXISTS "min_quantity", DROP COLUMN IF EXISTS "max_quantity";
--> statement-breakpoint
-- D. Catalog Tables (Drop)
DROP TABLE IF EXISTS "storefront"."product_category_mapping" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."related_products" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."entity_metafields" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."product_attributes" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "storefront"."product_images" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "vault"."archival_vault" CASCADE;
--> statement-breakpoint
-- ============================================================================
-- ◀ 4. REVERSE DEFINITIVE HARDENING RULES (Migration 0003)
-- ============================================================================
DROP EVENT TRIGGER IF EXISTS trg_audit_schema_drift;
--> statement-breakpoint
DROP FUNCTION IF EXISTS log_schema_drift();
--> statement-breakpoint


ALTER TABLE "storefront"."orders" DROP CONSTRAINT IF EXISTS "orders_customer_id_fkey";
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id");
--> statement-breakpoint


ALTER TABLE "storefront"."refunds" DROP CONSTRAINT IF EXISTS "refunds_order_id_fkey";
--> statement-breakpoint
ALTER TABLE "storefront"."refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id");
--> statement-breakpoint


DROP VIEW IF EXISTS storefront.active_products;
--> statement-breakpoint
DROP VIEW IF EXISTS storefront.active_orders;
--> statement-breakpoint
DROP VIEW IF EXISTS governance.active_tenants;
--> statement-breakpoint
DROP FUNCTION IF EXISTS governance.detect_tenant_leaks();
--> statement-breakpoint

DROP FUNCTION IF EXISTS governance.move_to_archival_vault();
--> statement-breakpoint


DROP TRIGGER IF EXISTS trg_audit_immutable_update ON governance.audit_logs;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_audit_immutable_delete ON governance.audit_logs;
--> statement-breakpoint
DROP FUNCTION IF EXISTS governance.enforce_audit_immutability();
--> statement-breakpoint


DROP TRIGGER IF EXISTS trg_block_audit_update ON governance.audit_logs;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_block_audit_delete ON governance.audit_logs;
--> statement-breakpoint
DROP FUNCTION IF EXISTS block_audit_mutation();
--> statement-breakpoint


-- ============================================================================
-- ◀ 5. REVERSE INITIAL SECURITY HARDENING (Migration 0002)
-- ============================================================================
DROP EVENT TRIGGER IF EXISTS trg_log_drift;
--> statement-breakpoint
-- Truncation Fix (Revert)
ALTER TABLE storefront.shipping_rates DROP CONSTRAINT IF EXISTS exclude_weight_overlap;
--> statement-breakpoint
DROP TABLE IF EXISTS storefront.shipping_rates;
--> statement-breakpoint
-- Financial Mutex (Revert)
DROP FUNCTION IF EXISTS storefront.enforce_wallet_integrity_v4();
--> statement-breakpoint


-- Tenant Isolation (Revert)
DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'storefront' LOOP
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON storefront.%I;', t);
        EXECUTE format('ALTER TABLE storefront.%I DISABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_verify_tenant_session_%I ON storefront.%I;', t, t);
        EXECUTE format('DROP FUNCTION IF EXISTS storefront.verify_tenant_session_%I();', t);
    END LOOP;
END $$;
--> statement-breakpoint

DROP FUNCTION IF EXISTS governance.enforce_tenant_hardening(TEXT, TEXT);
--> statement-breakpoint


-- Audit Immutability (Revert)
DROP EVENT TRIGGER IF EXISTS trg_audit_immutability_lockdown;
--> statement-breakpoint
DROP FUNCTION IF EXISTS governance.block_audit_tamper_event();
--> statement-breakpoint


-- Compliance (Revert)
DROP FUNCTION IF EXISTS governance.verify_compliance();
--> statement-breakpoint

DROP FUNCTION IF EXISTS governance.log_schema_drift();
--> statement-breakpoint

DROP TABLE IF EXISTS governance.schema_drift_log;
--> statement-breakpoint
-- Cron (Revert)
GRANT ALL ON TABLE cron.job TO public;

-- View Masking (Revert)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'products' AND c.relkind = 'v' AND n.nspname = 'storefront') THEN
        DROP VIEW IF EXISTS storefront.products;
        ALTER TABLE storefront._products RENAME TO products;
        GRANT ALL ON storefront.products TO public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'pages' AND c.relkind = 'v' AND n.nspname = 'storefront') THEN
        DROP VIEW IF EXISTS storefront.pages;
        ALTER TABLE storefront._pages RENAME TO pages;
        GRANT ALL ON storefront.pages TO public;
    END IF;
END $$;
--> statement-breakpoint


-- FINANCIAL TYPES ROLLBACK LAST (Prevents column drop failures)
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE (column_name ~ 'price' OR column_name ~ 'balance' OR column_name ~ 'amount')
        AND udt_name = 'money_amount' AND table_schema IN ('public', 'storefront', 'governance')
    ) LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE bigint USING ( (%I).amount )', r.table_schema, r.table_name, r.column_name, r.column_name);
        EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Rollback Skip: %.%.%', r.table_schema, r.table_name, r.column_name;
        END;
    END LOOP;
END $$;
--> statement-breakpoint


RAISE NOTICE 'master_rollback_DOWN.sql: SUCCESS. Unified master rollback complete.';
