-- 🚨 Audit 999 Financial Hardening: 0053_wallet_occ_and_currency.sql

-- 1. Wallet Non-Negative Trigger (Audit Point #20)
CREATE OR REPLACE FUNCTION storefront.enforce_wallet_non_negative()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.wallet_balance->>'amount')::BIGINT < 0 THEN
        RAISE EXCEPTION 'S5 Violation: Wallet balance cannot be negative.' 
        USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Dynamic Wallet Currency (Audit Point #41)
CREATE OR REPLACE FUNCTION storefront.set_default_wallet_currency()
RETURNS TRIGGER AS $$
DECLARE
    tenant_currency TEXT;
BEGIN
    -- Only set if currency is missing or NULL
    IF NEW.wallet_balance->>'currency' IS NULL OR NEW.wallet_balance->>'currency' = '' THEN
        SELECT currency INTO tenant_currency FROM governance.tenants WHERE id = NEW.tenant_id;
        NEW.wallet_balance := jsonb_set(
            COALESCE(NEW.wallet_balance::jsonb, '{"amount": 0, "currency": "SAR"}'::jsonb),
            '{currency}',
            to_jsonb(COALESCE(tenant_currency, 'SAR'))
        )::public.money_amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Robust OCC Handling (Audit Point #29)
CREATE OR REPLACE FUNCTION storefront.handle_occ_version_increment()
RETURNS TRIGGER AS $$
BEGIN
    -- Audit Point #29: Handle NULL as 0
    NEW.version := COALESCE(NEW.version, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply Triggers to Tables
DO $$
BEGIN
    -- Customer Wallet Triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wallet_safeguard') THEN
        CREATE TRIGGER trg_wallet_safeguard
        BEFORE INSERT OR UPDATE OF wallet_balance ON storefront.customers
        FOR EACH ROW EXECUTE FUNCTION storefront.enforce_wallet_non_negative();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wallet_currency_default') THEN
        CREATE TRIGGER trg_wallet_currency_default
        BEFORE INSERT ON storefront.customers
        FOR EACH ROW EXECUTE FUNCTION storefront.set_default_wallet_currency();
    END IF;

    -- OCC triggers for relevant tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_occ_increment') THEN
        CREATE TRIGGER trg_occ_increment
        BEFORE UPDATE ON storefront.customers
        FOR EACH ROW EXECUTE FUNCTION storefront.handle_occ_version_increment();
    END IF;
END $$;
