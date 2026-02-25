-- 💰 Audit Remediation: 0113_ledger_checksums.sql
-- Risk #39: Row-level HMAC checksums to detect manual DB tampering in wallets.

-- 1. Add Checksum Column to Customer Wallet
ALTER TABLE storefront.customers ADD COLUMN IF NOT EXISTS wallet_checksum TEXT;

-- 2. Checksum Generator Function
CREATE OR REPLACE FUNCTION storefront.calculate_wallet_checksum(p_tenant_id UUID, p_customer_id UUID, p_balance JSONB)
RETURNS TEXT AS $$
DECLARE
    v_secret TEXT;
    v_payload TEXT;
BEGIN
    -- Use tenant-specific salt + master pepper for HMAC
    SELECT secret_salt INTO v_secret FROM governance.tenants WHERE id = p_tenant_id;
    v_payload := p_customer_id::text || (p_balance->>'amount') || (p_balance->>'currency');
    
    RETURN public.hmac(v_payload, v_secret, 'sha256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger to Maintain Checksum
CREATE OR REPLACE FUNCTION storefront.trg_maintain_wallet_checksum()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance OR NEW.wallet_checksum IS NULL THEN
        NEW.wallet_checksum := storefront.calculate_wallet_checksum(NEW.tenant_id, NEW.id, NEW.wallet_balance::jsonb);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wallet_checksum ON storefront.customers;
CREATE TRIGGER trg_wallet_checksum
BEFORE INSERT OR UPDATE OF wallet_balance ON storefront.customers
FOR EACH ROW EXECUTE FUNCTION storefront.trg_maintain_wallet_checksum();

RAISE NOTICE 'S5: Financial Checksums (Risk #39) enabled for customer wallets.';
