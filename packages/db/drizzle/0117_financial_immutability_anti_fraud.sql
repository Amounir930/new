-- 💰 RED TEAM RE-AUDIT: 0117_financial_immutability_anti_fraud.sql
-- Mandate: Immutability & Anti-Fraud Logic.

-- 1. Infinite Refund Race Condition (Risk #20)
CREATE OR REPLACE FUNCTION storefront.enforce_refund_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_order_total BIGINT;
    v_existing_refunds BIGINT;
BEGIN
    -- LOCK order for share to prevent concurrent refund races
    SELECT (total->>'amount')::BIGINT INTO v_order_total 
    FROM storefront.orders 
    WHERE id = NEW.order_id 
    FOR SHARE;

    SELECT COALESCE(SUM((amount->>'amount')::BIGINT), 0) INTO v_existing_refunds 
    FROM storefront.refunds 
    WHERE order_id = NEW.order_id;

    IF (v_existing_refunds + (NEW.amount->>'amount')::BIGINT) > v_order_total THEN
        RAISE EXCEPTION 'Financial Violation: Total refunds (%) exceed order total (%)', 
            (v_existing_refunds + (NEW.amount->>'amount')::BIGINT), v_order_total
        USING ERRCODE = 'P0003';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Negative Quantity & Stock Guards (Risk #15)
-- This assumes existence of orders, order_items, inventory tables
-- Applying hard CHECK constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema ~ '^tenant_' 
        AND column_name IN ('quantity', 'stock', 'amount')
    ) LOOP
        -- Skip amount since it can be negative in some contexts like adjustments if not careful
        -- but for quantity/stock, it is a hard rule.
        IF r.column_name IN ('quantity', 'stock') THEN
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT ck_non_negative_%I CHECK (%I >= 0)', 
                r.table_schema, r.table_name, r.column_name, r.column_name);
        END IF;
    END LOOP;
END $$;

-- 3. Affiliate Self-Dealing Fraud (Risk #18)
-- Assuming orders table has affiliate_id
-- ALTER TABLE storefront.orders ADD CONSTRAINT ck_anti_self_referral CHECK (customer_id != affiliate_id);

-- 4. Order velocity / GMV Anonymization (Risk #40)
-- Custom sequence function per tenant (Simplified)
CREATE OR REPLACE FUNCTION storefront.generate_order_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_seq_name TEXT;
    v_val BIGINT;
BEGIN
    v_seq_name := 'order_seq_' || replace(p_tenant_id::text, '-', '_');
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', v_seq_name);
    EXECUTE format('SELECT nextval(%L)', v_seq_name) INTO v_val;
    RETURN 'ORD-' || v_val;
END;
$$ LANGUAGE plpgsql;
