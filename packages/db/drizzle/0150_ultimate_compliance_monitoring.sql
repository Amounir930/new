-- 🚨 FATAL FORENSIC LOCKDOWN: Phase V — Compliance & Monitoring
-- 0150_ultimate_compliance_monitoring.sql

-- 1. Ledger Read-Verification (Risk #113)
-- Mandate: View that recalculates checksum on SELECT to detect tampering.
CREATE OR REPLACE VIEW storefront.vw_verified_wallets AS
SELECT 
    *,
    (wallet_checksum = public.calculate_wallet_checksum_v2(id, (wallet_balance).amount, (wallet_balance).currency, secret_salt)) as is_valid
FROM storefront.customers;

-- 2. Webhook Secret Encryption (Risk #113/High)
-- Mandate: Webhook secrets must be encrypted at rest.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhook_subscriptions' AND column_name = 'secret' AND data_type = 'text') THEN
        ALTER TABLE storefront.webhook_subscriptions ALTER COLUMN secret TYPE BYTEA USING pgp_sym_encrypt(secret, current_setting('app.master_key', true));
    END IF;
END $$;

-- 3. Automated Salt Rotation (Risk #110)
CREATE OR REPLACE FUNCTION governance.rotate_tenant_salts_ultimate()
RETURNS VOID AS $$
BEGIN
    UPDATE governance.tenants 
    SET secret_salt = encode(gen_random_bytes(32), 'hex'),
        updated_at = NOW();
    RAISE NOTICE 'Phase V: Quarterly salt rotation complete.';
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ultimate_salt_rotation') THEN
        PERFORM cron.schedule('ultimate_salt_rotation', '0 0 1 1,4,7,10 *', 'SELECT governance.rotate_tenant_salts_ultimate()');
    END IF;
END $$;

-- 4. Fraud Detection: Affiliate Device Fingerprinting (Risk #112)
CREATE OR REPLACE FUNCTION storefront.trg_block_affiliate_fraud_ultimate()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for self-referral via email OR device fingerprint (Risk #112)
    IF NEW.email = (SELECT email FROM storefront.customers WHERE id = NEW.customer_id) OR
       NEW.device_fingerprint = (SELECT device_fingerprint FROM storefront.customers WHERE id = NEW.customer_id) THEN
        RAISE EXCEPTION 'Fatal Violation: Affiliate self-referral detected (Fraud Guard #112).'
        USING ERRCODE = 'P0002';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Phase V: Ultimate Compliance Applied.';
