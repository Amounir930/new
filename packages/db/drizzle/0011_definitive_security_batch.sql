-- ============================================================
-- MIGRATION: 0011_definitive_security_batch.sql
-- Title: Advanced Security Hardening & Forensic Monitoring
-- Audit: APEX-DB-AUDIT-001 Findings S-1 to S-5
-- Date: 2026-03-02
-- ============================================================

SET search_path = public, storefront, governance, vault, shared;

-- ── 1. Encryption Key Versioning (S7 Compliance) ────────────────
-- Ensure vault.encryption_keys has a version column for rotation.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'vault' AND table_name = 'encryption_keys' AND column_name = 'key_version') THEN
        ALTER TABLE vault.encryption_keys ADD COLUMN key_version INTEGER DEFAULT 1 NOT NULL;
    END IF;
END $$;

-- ── 2. Reinforce PII Encryption (Zero-Trust Access) ──────────
-- Ensure vault.pii_encrypt is SECURITY DEFINER and restricted to authorized roles.
CREATE OR REPLACE FUNCTION vault.pii_encrypt(plain_text TEXT, p_version INTEGER DEFAULT 1)
RETURNS TEXT AS $$
DECLARE
    v_key TEXT;
BEGIN
    IF plain_text IS NULL OR plain_text = '' THEN RETURN plain_text; END IF;
    
    -- Load key based on version (logic for rotation)
    SELECT secret_key INTO v_key FROM vault.encryption_keys WHERE key_version = p_version AND is_active = true LIMIT 1;
    
    IF v_key IS NULL THEN
        RAISE EXCEPTION 'Vault Violation: Key version % not found or inactive', p_version USING ERRCODE = 'P0004';
    END IF;
    
    RETURN encode(encrypt_iv(plain_text::bytea, v_key::bytea, '0123456789abcdef'::bytea, 'aes'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION vault.pii_encrypt(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vault.pii_encrypt(TEXT, INTEGER) TO role_app_service;

-- ── 3. Proactive RLS Monitoring (Anti-Drift) ─────────────────
-- Function to detect if RLS has been disabled on critical tables.
CREATE OR REPLACE FUNCTION governance.check_rls_integrity()
RETURNS TABLE(schemaname TEXT, tablename TEXT, rowsecurity BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT t.schemaname::text, t.tablename::text, t.rowsecurity
    FROM pg_tables t
    WHERE t.schemaname IN ('storefront', 'governance', 'vault')
    AND t.rowsecurity = false
    AND t.tablename NOT LIKE '\_%'; -- Exclude views (often prefixed with _ if renamed or starting with _)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Secure Legacy Schema (Enforcement) ───────────────────
-- Final sweep to ensure legacy schema is truly a quarantine zone.
REVOKE ALL ON SCHEMA legacy FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA legacy FROM PUBLIC;

-- ── 5. Audit Drift Lockdown (Mandate #20) ────────────────────
-- Enable the event trigger for schema drift that was deferred.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'trg_audit_schema_drift') THEN
        CREATE EVENT TRIGGER trg_audit_schema_drift 
        ON ddl_command_end 
        EXECUTE FUNCTION governance.log_schema_drift();
    END IF;
END $$;

-- ── 6. View Leakage Prevention (Checks) ──────────────────────
-- Metadata comment to require manual review on view changes.
COMMENT ON SCHEMA storefront IS 'Strictly managed storefront data. All direct table access is forbidden; use views. Verify no sensitive columns (deleted_at, etc.) are exposed in public views.';
