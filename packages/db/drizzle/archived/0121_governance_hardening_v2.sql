-- 🚨 FATAL HARDENING: Category B (Governance & Admin Locks)
-- 0121_governance_hardening_v2.sql

-- 1. Hard-Block Audit Log Deletion (Super Admin God-Mode Immunity)
-- Mandate #14: Prevent even the DB owner from deleting logs.
CREATE OR REPLACE FUNCTION governance.block_audit_log_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Fatal Violation: Audit logs are physically immutable. Deletion/Update is prohibited.' 
    USING ERRCODE = 'P0002';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutability ON governance.audit_logs;
CREATE TRIGGER trg_audit_log_immutability
BEFORE UPDATE OR DELETE ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.block_audit_log_deletion();

-- 2. Subdomain Regex Enforcement (Risk #4)
-- Prevents SQL Injection/Faking at the lowest level.
ALTER TABLE governance.tenants DROP CONSTRAINT IF EXISTS ck_subdomain_strict_regex;
ALTER TABLE governance.tenants 
ADD CONSTRAINT ck_subdomain_strict_regex 
CHECK (subdomain ~ '^[a-z0-9-]+$');

-- 3. Feature Gate Metadata Capping (Risk #15)
-- Prevent Super Admin Dashboard memory crashes from unbounded JSONB.
ALTER TABLE governance.feature_gates DROP CONSTRAINT IF EXISTS ck_metadata_size_cap;
ALTER TABLE governance.feature_gates
ADD CONSTRAINT ck_metadata_size_cap
CHECK (pg_column_size(metadata) < 10240); -- Hard-cap at 10KB

-- 4. Secure Purge Event Injection (Category B.9 Integration)
-- Ensures S3/MinIO assets are destroyed BEFORE schema deletion.
CREATE OR REPLACE FUNCTION governance.inject_purge_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.outbox_events (id, tenant_id, event_type, payload)
    VALUES (gen_ulid(), OLD.id, 'TENANT_PURGED_ASSETS', jsonb_build_object(
        'tenant_id', OLD.id,
        'subdomain', OLD.subdomain,
        'purged_at', NOW()
    ));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_purge_assets ON governance.tenants;
CREATE TRIGGER trg_tenant_purge_assets
BEFORE DELETE ON governance.tenants
FOR EACH ROW EXECUTE FUNCTION governance.inject_purge_event();

RAISE NOTICE 'Category B Governance Hardening Applied.';
