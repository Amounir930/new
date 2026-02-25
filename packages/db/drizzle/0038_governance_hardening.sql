-- Mandate #12: DB-level Feature Gates
-- Prevents data insertion into paid feature tables if the tenant doesn't have the feature enabled.

CREATE OR REPLACE FUNCTION governance.check_feature_gate()
RETURNS TRIGGER AS $$
DECLARE
    f_key TEXT;
    f_enabled BOOLEAN;
    t_id UUID;
BEGIN
    -- Derive feature key from table name (simplified logic)
    IF TG_TABLE_NAME ~ '^b2b_' THEN
        f_key := 'b2b';
    ELSIF TG_TABLE_NAME ~ '^affiliate_' THEN
        f_key := 'marketing_affiliate';
    ELSIF TG_TABLE_NAME = 'flash_sales' THEN
        f_key := 'flash_sales';
    ELSE
        RETURN NEW;
    END IF;

    -- Get tenant ID from session
    t_id := current_setting('app.current_tenant', true)::uuid;
    
    -- Super admin bypass
    IF current_setting('app.role', true) = 'super_admin' THEN
        RETURN NEW;
    END IF;

    -- Check if feature is enabled for this tenant
    SELECT is_enabled INTO f_enabled 
    FROM governance.feature_gates 
    WHERE (tenant_id = t_id OR tenant_id IS NULL) 
    AND feature_key = f_key
    ORDER BY tenant_id NULLS LAST -- Tenant-specific takes precedence
    LIMIT 1;

    IF f_enabled IS NOT TRUE THEN
        RAISE EXCEPTION 'S1 Violation: Feature % is not enabled for this tenant.', f_key;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mandate #13: Schema-level Hard Delete (Cascade)
-- Safely drops a tenant schema and all related records in governance.

CREATE OR REPLACE FUNCTION governance.terminate_tenant(t_id UUID)
RETURNS VOID AS $$
DECLARE
    t_subdomain TEXT;
BEGIN
    -- 1. Identity Check
    SELECT subdomain INTO t_subdomain FROM governance.tenants WHERE id = t_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'S2 Critical: Cannot terminate non-existent tenant %', t_id;
    END IF;

    -- 2. Drop Schema (Mandate #13 Fix: Hard Delete Cascade)
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', 'tenant_' || t_subdomain);

    -- 3. Cleanup Governance References
    DELETE FROM governance.feature_gates WHERE tenant_id = t_id;
    DELETE FROM governance.tenant_quotas WHERE tenant_id = t_id;
    DELETE FROM governance.tenant_invoices WHERE tenant_id = t_id;
    DELETE FROM governance.app_usage_records WHERE tenant_id = t_id;
    
    -- 4. Mark tenant as archived instead of deleting from central registry (Audit purposes)
    UPDATE governance.tenants SET status = 'archived', updated_at = now() WHERE id = t_id;

    RAISE NOTICE 'S2: Tenant % (%) terminated and data purged.', t_id, t_subdomain;
END;
$$ LANGUAGE plpgsql;
