-- 🛡️ Audit 444 Neural Financials: 0105_audit_444_neural_financials.sql
-- Goal: Shift concurrency and timestamp intelligence to the database engine.

-- 1. Ensure 'version' column exists on 'orders'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'storefront' AND table_name = 'orders' AND column_name = 'version') THEN
        ALTER TABLE storefront.orders ADD COLUMN version INTEGER DEFAULT 1 NOT NULL;
    END IF;
END $$;

-- 2. Extend OCC Trigger to 'orders' and 'products'
-- Function 'storefront.handle_occ_version_increment' already exists from 0053.
DO $$
BEGIN
    -- Apply to orders
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_occ_increment') THEN
        CREATE TRIGGER trg_orders_occ_increment
        BEFORE UPDATE ON storefront.orders
        FOR EACH ROW EXECUTE FUNCTION storefront.handle_occ_version_increment();
    END IF;

    -- Apply to products
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_occ_increment') THEN
        CREATE TRIGGER trg_products_occ_increment
        BEFORE UPDATE ON storefront.products
        FOR EACH ROW EXECUTE FUNCTION storefront.handle_occ_version_increment();
    END IF;
END $$;

-- 3. Standardize 'updated_at' Defaults
ALTER TABLE storefront.orders ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE storefront.products ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE storefront.customers ALTER COLUMN updated_at SET DEFAULT NOW();
