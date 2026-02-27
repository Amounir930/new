-- 🚨 APEX V2 REMEDIATION: CATEGORY 1 (FINANCIAL & DATA INTEGRITY)
-- FILE: 0006_financial_and_data_integrity.sql
-- TARGET: 100% FINANCIAL COMPLIANCE

-- ─── 1. REGEX FINANCIAL LEAK FIX (S01-Extension) ────────────────
-- Fixing oversight where subtotal, discount, etc. were skipped in the bulk conversion.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name, column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema IN ('storefront', 'governance')
        AND (
            (table_name = 'orders' AND column_name IN ('subtotal', 'discount', 'shipping', 'tax', 'coupon_discount', 'refunded_amount')) OR
            (table_name = 'tenant_invoices' AND column_name IN ('subscription_amount', 'platform_commission', 'app_charges', 'total')) OR
            (table_name = 'order_items' AND column_name IN ('price', 'total', 'discount_amount', 'tax_amount')) OR
            (table_name = 'refund_items' AND column_name IN ('amount')) OR
            (table_name = 'refunds' AND column_name IN ('amount')) OR
            (table_name = 'purchase_orders' AND column_name IN ('subtotal', 'tax', 'shipping_cost', 'total')) OR
            (table_name = 'purchase_order_items' AND column_name IN ('unit_cost'))
        )
        AND data_type = 'bigint'
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE public.money_amount 
                        USING (ROW(%I, ''SAR'')::public.money_amount)', 
            r.table_schema, r.table_name, r.column_name, r.column_name);
        RAISE NOTICE 'Financial Fix: Converted %.%.% to money_amount', r.table_schema, r.table_name, r.column_name;
    END LOOP;
END $$;
--> statement-breakpoint

-- ─── 2. UNBOUNDED REFUNDS PROTECTION ────────────────────────────
-- Ensures SUM(refunds.amount) <= orders.total

CREATE OR REPLACE FUNCTION storefront.check_refund_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_order_total BIGINT;
    v_total_refunded BIGINT;
BEGIN
    -- Get original order total (amount part of composite)
    SELECT (total).amount INTO v_order_total 
    FROM storefront.orders 
    WHERE id = NEW.order_id;

    -- Calculate sum of existing refunds + NEW refund
    SELECT COALESCE(SUM((amount).amount), 0) INTO v_total_refunded
    FROM storefront.refunds
    WHERE order_id = NEW.order_id;

    IF (v_total_refunded + (NEW.amount).amount) > v_order_total THEN
        RAISE EXCEPTION 'Financial Violation: Total refund amount (%) exceeds order total (%)', 
            (v_total_refunded + (NEW.amount).amount), v_order_total
            USING ERRCODE = 'P0006';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_refund_limit ON storefront.refunds;
--> statement-breakpoint
CREATE TRIGGER trg_check_refund_limit
BEFORE INSERT ON storefront.refunds
FOR EACH ROW EXECUTE FUNCTION storefront.check_refund_limit();

-- ─── 3. COUPON CONCURRENCY & USAGE TRACKING ─────────────────────
-- Prevents race conditions bypassing max_uses_per_customer.

CREATE TABLE IF NOT EXISTS storefront.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL,
    coupon_id UUID NOT NULL REFERENCES storefront.coupons(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES storefront.customers(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES storefront.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_lookup ON storefront.coupon_usages (customer_id, coupon_id);

CREATE OR REPLACE FUNCTION storefront.enforce_coupon_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_max_uses INT;
    v_current_uses INT;
BEGIN
    SELECT max_uses_per_customer INTO v_max_uses 
    FROM storefront.coupons 
    WHERE id = NEW.coupon_id;

    IF v_max_uses IS NOT NULL AND v_max_uses > 0 THEN
        SELECT COUNT(*) INTO v_current_uses 
        FROM storefront.coupon_usages 
        WHERE customer_id = NEW.customer_id AND coupon_id = NEW.coupon_id;

        IF v_current_uses >= v_max_uses THEN
            RAISE EXCEPTION 'Promotion Violation: Max uses for this coupon reached by customer.'
                USING ERRCODE = 'P0007';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_coupon_limits ON storefront.coupon_usages;
--> statement-breakpoint
CREATE TRIGGER trg_enforce_coupon_limits
BEFORE INSERT ON storefront.coupon_usages
FOR EACH ROW EXECUTE FUNCTION storefront.enforce_coupon_limits();

-- ─── 4. INVENTORY LOG IMMUTABILITY (Audit Protection) ───────────
-- Blocks UPDATE and DELETE on inventory_movements.

CREATE OR REPLACE FUNCTION storefront.block_inventory_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Data Integrity Violation: Mutations on inventory_movements are forbidden (Audit Trail Locked).'
        USING ERRCODE = 'P0008';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_inventory_update ON storefront.inventory_movements;
--> statement-breakpoint
CREATE TRIGGER trg_block_inventory_update
BEFORE UPDATE ON storefront.inventory_movements
FOR EACH ROW EXECUTE FUNCTION storefront.block_inventory_mutation();

DROP TRIGGER IF EXISTS trg_block_inventory_delete ON storefront.inventory_movements;
--> statement-breakpoint
CREATE TRIGGER trg_block_inventory_delete
BEFORE DELETE ON storefront.inventory_movements
FOR EACH ROW EXECUTE FUNCTION storefront.block_inventory_mutation();

-- ─── 5. B2B PRICING OVERLAP PREVENTION ──────────────────────────
-- Uses EXCLUDE constraint to handle period/quantity collisions strictly.

DROP INDEX IF EXISTS storefront.idx_b2b_tier_collision;
--> statement-breakpoint

ALTER TABLE storefront.b2b_pricing_tiers 
DROP CONSTRAINT IF EXISTS exclude_b2b_pricing_overlap;
--> statement-breakpoint

ALTER TABLE storefront.b2b_pricing_tiers 
ADD CONSTRAINT exclude_b2b_pricing_overlap 
EXCLUDE USING gist (
    tenant_id WITH =,
    company_id WITH =,
    product_id WITH =,
    int4range(min_quantity, COALESCE(max_quantity, 2147483647), '[]') WITH &&
);
--> statement-breakpoint

RAISE NOTICE 'Category 1 Remediation Complete.';
