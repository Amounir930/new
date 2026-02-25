-- 🚨 V8 Security Hardening: 0047_security_v4_pgcrypto.sql

-- 1. Native HMAC Validation for Role Escalation (V8 Point #38)
-- Moves cryptographic proof from App layer to DB for Zero-Trust.

CREATE OR REPLACE FUNCTION governance.validate_role_escalation_v2(
    target_role TEXT,
    signature TEXT,
    timestamp_str TEXT,
    nonce TEXT
)
RETURNS boolean AS $$
DECLARE
    secret TEXT := current_setting('app.master_key', true);
    payload TEXT;
    expected_signature TEXT;
    sig_time TIMESTAMP;
BEGIN
    IF target_role != 'system' THEN RETURN true; END IF;

    -- 1. Anti-Replay: Timing Check (5 mins window)
    sig_time := to_timestamp(timestamp_str::bigint / 1000);
    IF abs(extract(epoch from (now() - sig_time))) > 300 THEN
        RAISE EXCEPTION 'S1 Violation: Cryptographic proof expired.' USING ERRCODE = 'P0012';
    END IF;

    -- 2. Recalculate Signature
    payload := target_role || ':' || timestamp_str || ':' || nonce;
    expected_signature := public.hmac(payload, secret, 'sha256');

    IF signature != expected_signature THEN
        RAISE EXCEPTION 'S1 Violation: Invalid role escalation signature.' USING ERRCODE = 'P0013';
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Automated Key Rotation Rejection (V8 Point #3 Hint)
-- Rejects keys older than 90 days for new encryptions.

CREATE OR REPLACE FUNCTION vault.check_key_staleness()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM vault.encryption_keys 
        WHERE tenant_id = NEW.tenant_id 
        AND is_active = true 
        AND rotated_at < now() - INTERVAL '90 days'
    ) THEN
        RAISE EXCEPTION 'S7 Violation: Encryption key is stale (> 90 days). Rotation mandatory.' 
        USING ERRCODE = 'P0014';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to vault operations (where new keys/data are pushed)
-- Note: Assuming there's a table for tenant data that uses these keys.

-- 3. Audit Checksum Verification on Read (V8 Point #35 Pattern)
CREATE OR REPLACE VIEW governance.vw_verified_audit_logs AS
SELECT *,
    (checksum = public.hmac(
        COALESCE(tenant_id::text, '') || 
        COALESCE(action, '') || 
        COALESCE(entity_id::text, '') || 
        COALESCE(old_values::text, '') || 
        COALESCE(new_values::text, ''),
        current_setting('app.master_key', true),
        'sha256'
    )) as is_valid
FROM governance.audit_logs;
