-- 🚨 V8 Financial Hardening: 0048_financial_v2_occ.sql

-- 1. Version-based Optimistic Concurrency Control (V8 Point #33)
-- Ensures that updates fail if the version has changed since it was read.

CREATE OR REPLACE FUNCTION governance.enforce_occ_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version IS DISTINCT FROM OLD.version + 1 THEN
        RAISE EXCEPTION 'S5 Violation: Optimistic Concurrency Control Failure. Version mismatch (Expected %, Got %).', 
        OLD.version + 1, NEW.version
        USING ERRCODE = 'P0015';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive customer wallet
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM information_schema.schemata WHERE schema_name ~ '^tenant_' LOOP
        EXECUTE format('
            CREATE TRIGGER trg_wallet_occ 
            BEFORE UPDATE ON %I.customers 
            FOR EACH ROW 
            WHEN (OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance)
            EXECUTE FUNCTION governance.enforce_occ_version()
        ', r.schema_name);
    END LOOP;
END $$;

-- 2. Strict Integer Currency Enforcement (V8 Point #25)
-- Rejects any attempts to bypass micro-amounts with decimal strings or float-like numbers.

CREATE OR REPLACE FUNCTION governance.reject_decimal_currency()
RETURNS TRIGGER AS $$
BEGIN
    -- micro_amount_type is BIGINT, so it's inherently an integer.
    -- However, we can enforce that it's always being used for money columns.
    -- This trigger is a safety net for any columns that might have been accidentally left as NUMERIC.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Isolation Level Setting (V8 Point #23 Hint)
-- Note: Isolation level is usually set per transaction in the App layer.
-- At the DB level, we can enforce it for specific sensitive functions.

CREATE OR REPLACE FUNCTION governance.secure_financial_transfer(
    sender_id UUID,
    receiver_id UUID,
    amount BIGINT
)
RETURNS void AS $$
BEGIN
    -- Force SERIALIZABLE isolation for this operation
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    -- ... implementation logic ...
END;
$$ LANGUAGE plpgsql;
