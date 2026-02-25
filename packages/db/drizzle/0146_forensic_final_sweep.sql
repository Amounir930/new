-- 🚨 FATAL FORENSIC LOCKDOWN: Phase IV — Final Sweep
-- 0146_forensic_final_sweep.sql

-- 1. Role Escalation Hardening (Risk #47)
-- Mandate: Ensure set_app_role() calls HMAC validation.
CREATE OR REPLACE FUNCTION governance.set_app_role_v3(
    requested_role TEXT, 
    signature TEXT, 
    timestamp TEXT, 
    nonce TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Risk #47: Infallible HMAC Validation
    PERFORM governance.validate_role_escalation_v2(requested_role, signature, timestamp, nonce);
    
    -- Execute escalation
    EXECUTE format('SET LOCAL "app.role" = %L', requested_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tenant-Specific SKU Uniqueness (Risk #42)
-- Mandate: uq_sku_per_tenant helper must be enforceable.
CREATE OR REPLACE FUNCTION governance.enforce_sku_uniqueness_forensic(p_schema TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('ALTER TABLE %I.products DROP CONSTRAINT IF EXISTS uq_sku_per_tenant', p_schema);
    EXECUTE format('ALTER TABLE %I.products ADD CONSTRAINT uq_sku_per_tenant UNIQUE (sku, tenant_id)', p_schema);
END;
$$ LANGUAGE plpgsql;

-- 3. Automated Salt Rotation (Risk #112)
-- Mandate: rotate_tenant_salts() must be scheduled.
CREATE OR REPLACE FUNCTION governance.rotate_tenant_salts_forensic()
RETURNS VOID AS $$
BEGIN
    -- Rotation logic...
    UPDATE governance.tenants 
    SET secret_salt = encode(gen_random_bytes(32), 'hex'),
        updated_at = NOW();
    
    RAISE NOTICE 'Forensic: All tenant salts rotated.';
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'salt_rotation_forensic') THEN
        PERFORM cron.schedule('salt_rotation_forensic', '0 0 1 1,4,7,10 *', 'SELECT governance.rotate_tenant_salts_forensic()');
    END IF;
END $$;

-- 4. Audit Checksum alerting (Risk #104)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'audit_integrity_alert') THEN
        PERFORM cron.schedule('audit_integrity_alert', '0 * * * *', 
            $$SELECT pg_notify('audit_tamper', 'CRITICAL: Audit log tampering detected!') FROM governance.vw_verified_audit_logs WHERE is_integrity_valid = false LIMIT 1$$);
    END IF;
END $$;

RAISE NOTICE 'Phase IV: Final Forensic Sweep Applied.';
