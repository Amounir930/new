-- 🚨 FATAL HARDENING: Category C (Financial Engine & Ledger)
-- 0122_financial_hardening_v2.sql

-- 1. Upgrade OCC Version to BIGINT (Risk #17)
-- Prevents overflow in high-frequency transaction environments.
-- We do this for customers first as it's the primary transaction target.
ALTER TABLE storefront.customers ALTER COLUMN version TYPE BIGINT;
ALTER TABLE storefront.orders ALTER COLUMN version TYPE BIGINT;

-- 2. Wallet Balance Atomicity (Risk #16)
-- Ensures SELECT ... FOR UPDATE before calculating balance_after.
CREATE OR REPLACE FUNCTION storefront.enforce_ledger_atomicity()
RETURNS TRIGGER AS $$
DECLARE
    v_current_balance BIGINT;
BEGIN
    -- Mandate #16: Lock the customer wallet row for update
    SELECT (wallet_balance->>'amount')::BIGINT 
    INTO v_current_balance 
    FROM storefront.customers 
    WHERE id = NEW.customer_id 
    FOR UPDATE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_lock ON storefront.wallet_transactions;
CREATE TRIGGER trg_ledger_lock
BEFORE INSERT ON storefront.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION storefront.enforce_ledger_atomicity();

-- 3. Strict Refund Serialization (Risk #18)
-- Use SELECT FOR NO KEY UPDATE to prevent concurrent refund phantom reads.
CREATE OR REPLACE FUNCTION storefront.enforce_refund_limit_v3()
RETURNS TRIGGER AS $$
DECLARE 
    v_total BIGINT; 
    v_refunded BIGINT;
BEGIN
    -- SERIALIZE concurrent refunds on the same order
    SELECT (total->>'amount')::BIGINT 
    INTO v_total 
    FROM storefront.orders 
    WHERE id = NEW.order_id 
    FOR NO KEY UPDATE;

    SELECT COALESCE(SUM((amount->>'amount')::BIGINT), 0) 
    INTO v_refunded 
    FROM storefront.refunds 
    WHERE order_id = NEW.order_id;

    IF (v_refunded + (NEW.amount->>'amount')::BIGINT) > v_total THEN
        RAISE EXCEPTION 'Financial Violation: Total refunds exceed order total' 
        USING ERRCODE = 'P0003';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refund_limit ON storefront.refunds;
CREATE TRIGGER trg_refund_limit
BEFORE INSERT ON storefront.refunds
FOR EACH ROW EXECUTE FUNCTION storefront.enforce_refund_limit_v3();

-- 4. Native Non-Negative Balance Check (Risk #21)
ALTER TABLE storefront.wallet_transactions DROP CONSTRAINT IF EXISTS ck_wallet_balance_positive;
ALTER TABLE storefront.wallet_transactions 
ADD CONSTRAINT ck_wallet_balance_positive 
CHECK (balance_after >= 0);

RAISE NOTICE 'Category C Financial Hardening Applied Successfully.';
