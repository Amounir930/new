-- 🛡️ V6 FATAL AUDIT - WALLET OCC & COVERING INDEX NEURAL LINK (MANDATES #20 & #27)

-- Mandate #27: Drizzle lacks native INCLUDE support for indexing. 
-- The user reported Heap Exhaustion on products. I must execute this directly.
DROP INDEX IF EXISTS idx_products_active_covering;
CREATE INDEX idx_products_active_covering 
ON storefront.products (is_active) 
INCLUDE (base_price, slug, name, main_image) 
WHERE (deleted_at IS NULL);

-- Mandate #20: Wallet OCC (Optimistic Concurrency Control) Enforcement.
-- If an API changes the wallet balance without correctly incrementing the version,
-- or if a race condition occurs, the DB must halt it violently.
CREATE OR REPLACE FUNCTION storefront.enforce_wallet_occ()
RETURNS TRIGGER AS $$
BEGIN
    -- Only enforce OCC if the balance is actually changing
    IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
        -- The application MUST explicitly send NEW.version = OLD.version + 1
        -- and the WHERE clause should have matched OLD.version.
        -- If NEW.version isn't exactly OLD + 1, it's a Concurrent Modification or Bad API logic.
        IF NEW.version IS NOT DISTINCT FROM OLD.version THEN
            RAISE EXCEPTION 'OCC Violation: Wallet balance update requires version increment.';
        END IF;

        IF NEW.version != OLD.version + 1 THEN
            RAISE EXCEPTION 'OCC Violation: Stale wallet version. Expected %, got %', OLD.version + 1, NEW.version;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_wallet_occ ON storefront.customers;
CREATE TRIGGER trg_enforce_wallet_occ
    BEFORE UPDATE ON storefront.customers
    FOR EACH ROW
    EXECUTE FUNCTION storefront.enforce_wallet_occ();
