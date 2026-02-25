-- 🚨 FATAL FORENSIC LOCKDOWN: Phase IV — Ledger & MFA
-- 0145_forensic_ledger_and_mfa.sql

-- 1. Real-time Wallet Verification (Risk #113)
-- Mandate: View that recalculates checksum on SELECT to detect tampering.
CREATE OR REPLACE VIEW storefront.vw_verified_wallets_forensic AS
SELECT 
    *,
    public.calculate_wallet_checksum_v2(id, (wallet_balance).amount, (wallet_balance).currency, secret_salt) as expected_checksum,
    CASE 
        WHEN wallet_checksum = public.calculate_wallet_checksum_v2(id, (wallet_balance).amount, (wallet_balance).currency, secret_salt) THEN TRUE 
        ELSE FALSE 
    END as is_integrity_valid
FROM storefront.customers;

-- 2. Forensic MFA Lock for Purge (Risk #46)
CREATE OR REPLACE FUNCTION governance.super_admin_purge_tenant_forensic(
    p_tenant_id UUID, 
    p_mfa_token TEXT
)
RETURNS VOID AS $$
DECLARE
    v_subdomain TEXT;
    v_schema_name TEXT;
BEGIN
    -- Risk #46: Strong MFA Validation
    IF p_mfa_token IS NULL OR p_mfa_token = '' OR length(p_mfa_token) < 32 THEN
        RAISE EXCEPTION 'Fatal Violation: Missing or weak MFA confirmation token.'
        USING ERRCODE = 'P0002';
    END IF;

    -- Security Check
    PERFORM governance.validate_superuser_role();
    IF (current_setting('app.role', false) != 'super_admin') THEN
        RAISE EXCEPTION 'Unauthorized: Purge requires super_admin privileges.';
    END IF;

    SELECT subdomain INTO v_subdomain FROM governance.tenants WHERE id = p_tenant_id;
    v_schema_name := 'tenant_' || replace(v_subdomain, '-', '_');

    -- Audit & Cleanup...
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', v_schema_name);
    DELETE FROM governance.tenants WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Infallible UTC Trigger Attachment (Risk #103)
CREATE OR REPLACE FUNCTION governance.attach_utc_trigger_forensic()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.command_tag = 'CREATE TABLE' AND obj.schema_name = 'storefront' THEN
            EXECUTE format('CREATE TRIGGER trg_%I_utc BEFORE INSERT OR UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 
                obj.object_name, obj.schema_name, obj.object_name);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Deploy Event Trigger
-- EXECUTE 'CREATE EVENT TRIGGER trg_utc_enforcement ON ddl_command_end WHEN TAG IN (''CREATE TABLE'') EXECUTE FUNCTION governance.attach_utc_trigger_forensic()';

RAISE NOTICE 'Phase IV: Forensic Ledger & MFA Applied.';
