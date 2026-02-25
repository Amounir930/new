-- Mandate #27: Audit Log Immutability
-- Mandate #30: RBAC Cross-Tenant Bypass Prevention

-- 1. Prevent Truncate/Delete on Audit Logs
CREATE OR REPLACE FUNCTION governance.prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE') THEN
        RAISE EXCEPTION 'Security Violation: Audit logs are immutable and cannot be deleted or truncated'
        USING ERRCODE = 'P0005';
    END IF;
    
    IF (TG_OP = 'UPDATE') THEN
        RAISE EXCEPTION 'Security Violation: Audit logs are immutable and cannot be modified'
        USING ERRCODE = 'P0006';
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_audit_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON governance.audit_logs FOR EACH STATEMENT EXECUTE FUNCTION governance.prevent_audit_tampering();

-- 2. Final RBAC Lockdown (Mandate #30)
-- Ensure search_path is always set to 'public' for super_admin roles
-- and restricted to 'tenant_X, public' for tenant roles.
-- This is partially handled in core.ts, but let's add a DB-level safety check.

CREATE OR REPLACE FUNCTION storefront.validate_session_context()
RETURNS void AS $$
BEGIN
    -- If current user is not super_admin, verify tenant context matches search_path
    -- Mandate #1: current_setting('app.current_tenant', false) throws FATAL error if missing
    IF CURRENT_USER != 'super_admin' THEN
        IF CURRENT_SETTING('search_path') NOT LIKE 'tenant_' || CURRENT_SETTING('app.current_tenant') || '%' THEN
            RAISE EXCEPTION 'RBAC Violation: Tenant context mismatch. Potential cross-tenant bypass attempt.'
            USING ERRCODE = 'P0007';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;
