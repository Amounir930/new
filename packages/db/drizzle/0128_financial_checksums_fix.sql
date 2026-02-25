-- 🚨 FATAL HARDENING: Category C (Financial Engine & Deterministic Checksums)
-- 0128_financial_checksums_fix.sql

-- 1. Deterministic Wallet Checksum (Risk #24)
-- Mandate #24: HMAC over JSONB MUST extract specific keys predictably.
-- Prevents desync when key order changes in generic ::text cast.
CREATE OR REPLACE FUNCTION storefront.calculate_wallet_checksum(p_tenant_id UUID, p_customer_id UUID, p_balance JSONB)
RETURNS TEXT AS $$
DECLARE
    v_secret TEXT;
    v_payload TEXT;
BEGIN
    SELECT secret_salt INTO v_secret FROM governance.tenants WHERE id = p_tenant_id;
    
    -- Fatal Lock: Deterministic key extraction (amount, currency, last_sync)
    v_payload := p_customer_id::text 
                 || (p_balance->>'amount') 
                 || (p_balance->>'currency')
                 || COALESCE(p_balance->>'last_sync', '0');
    
    RETURN public.hmac(v_payload, v_secret, 'sha256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Deterministic Audit Log Checksum (Risk #24)
-- Ensures audit log integrity remains valid regardless of JSONB internal representation.
CREATE OR REPLACE FUNCTION governance.calculate_audit_checksum(
    p_action TEXT,
    p_old_values JSONB,
    p_new_values JSONB
)
RETURNS TEXT AS $$
DECLARE
    v_master_secret TEXT := COALESCE(current_setting('app.audit_hmac_secret', true), 'static_audit_pepper');
    v_payload TEXT;
BEGIN
    -- Force sorted text output for deterministic HMAC
    v_payload := p_action 
                 || jsonb_path_query_array(p_old_values, '$.keyvalue()')::text
                 || jsonb_path_query_array(p_new_values, '$.keyvalue()')::text;
    
    RETURN public.hmac(v_payload, v_master_secret, 'sha256');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Affiliate Device Fingerprinting (Risk #25)
-- Mandate #25: Prevent self-referral spoofing via device fingerprinting.
ALTER TABLE storefront.affiliate_partners ADD COLUMN IF NOT EXISTS last_known_fingerprint TEXT;
ALTER TABLE storefront.customers ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

CREATE OR REPLACE FUNCTION storefront.trg_block_affiliate_self_referral()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM storefront.affiliate_partners 
        WHERE id = NEW.affiliate_id 
        AND (last_known_fingerprint = NEW.device_fingerprint OR owner_email_hash = storefront.hash_sensitive_data(NEW.email))
    ) THEN
        RAISE EXCEPTION 'Fraud Violation: Self-referral attempt detected via fingerprint'
        USING ERRCODE = 'P0003';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Category C: Financial Engine & Checksum Hardening Applied.';
