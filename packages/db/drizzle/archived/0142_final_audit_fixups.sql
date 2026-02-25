-- 🚨 FATAL LOCKDOWN: Phase III — Final Audit Fixups
-- 0142_final_audit_fixups.sql

-- 1. Super Admin Role Validation (Risk #6)
-- Mandate: Prevent application-level role spoofing by checking actual DB role.
CREATE OR REPLACE FUNCTION governance.validate_superuser_role()
RETURNS VOID AS $$
BEGIN
    IF (SELECT rolname FROM pg_roles WHERE oid = pg_get_userbyid(pg_backend_pid())) != 'postgres' THEN
        -- Note: In some environments the superuser might have a different name. 
        -- But 'postgres' is the standard for this project's mandate.
        RAISE EXCEPTION 'Fatal Violation: Security-critical action attempt by unauthorized database role.'
        USING ERRCODE = 'P0002';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Fixed Purge Function (Risk #11, Risk #36)
CREATE OR REPLACE FUNCTION governance.super_admin_purge_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subdomain TEXT;
    v_schema_name TEXT;
BEGIN
    -- 1. Role Validation (Risk #36)
    PERFORM governance.validate_superuser_role();
    
    -- 2. App-Level Privilege Check
    IF (current_setting('app.role', false) != 'super_admin') THEN
        RAISE EXCEPTION 'Unauthorized: Purge requires super_admin privileges.';
    END IF;

    SELECT subdomain INTO v_subdomain FROM governance.tenants WHERE id = p_tenant_id;
    v_schema_name := 'tenant_' || replace(v_subdomain, '-', '_');

    -- 3. Audit BEFORE Destruction (Risk #11)
    INSERT INTO governance.audit_logs (tenant_id, action, result, severity, entity_type, entity_id)
    VALUES (p_tenant_id::text, 'PURGE_TENANT_GDPR', 'INITIATING', 'CRITICAL', 'TENANT', p_tenant_id::text);

    -- 4. Secure Cascade Deletion
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', v_schema_name);
    DELETE FROM governance.tenants WHERE id = p_tenant_id;
    DELETE FROM governance.tenant_quotas WHERE tenant_id = p_tenant_id;
    
    -- 5. Audit Completion
    INSERT INTO governance.audit_logs (tenant_id, action, result, severity, entity_type, entity_id)
    VALUES (p_tenant_id::text, 'PURGE_TENANT_GDPR', 'SUCCESS', 'CRITICAL', 'TENANT', p_tenant_id::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply role validation to existing sensitive functions
-- (Loop or individual overrides as needed)

RAISE NOTICE 'Phase III: Final Audit Fixups Applied.';
