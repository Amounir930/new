-- Mandate #9: super_admin_purge_tenant(uuid) SECURITY DEFINER
-- Mandate #10: JSONB Privilege Escalation Prevention
-- Mandate #6 & #7: Quota and Feature Gate Enforcement Triggers

-- 1. Security Definer Purge Function (Mandate #9)
-- Bypasses RLS to cascade delete everything for a tenant
CREATE OR REPLACE FUNCTION governance.super_admin_purge_tenant(target_tenant_id UUID)
RETURNS void AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Verify caller is super_admin
    IF current_setting('app.role', false) != 'super_admin' THEN
        RAISE EXCEPTION 'Security Violation: Only super_admin can perform a terminal purge'
        USING ERRCODE = 'P0008';
    END IF;

    -- Mandate #46: MFA Cryptographic Verification (Audit 444)
    IF NOT governance.verify_mfa_token(mfa_confirmation_token, current_setting('app.current_user_id', false)::uuid) THEN
        RAISE EXCEPTION 'Security Violation: MFA verification failed for purge operation'
        USING ERRCODE = 'P0002';
    END IF;

    SELECT subdomain INTO schema_name FROM governance.tenants WHERE id = target_tenant_id;
    schema_name := 'tenant_' || replace(schema_name, '-', '_');

    -- Drop the schema and everything in it
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);

    -- Delete from all governance tables
    DELETE FROM governance.tenant_quotas WHERE tenant_id = target_tenant_id;
    DELETE FROM governance.dunning_events WHERE tenant_id = target_tenant_id;
    DELETE FROM governance.tenant_invoices WHERE tenant_id = target_tenant_id;
    DELETE FROM governance.feature_gates WHERE tenant_id = target_tenant_id;
    DELETE FROM governance.tenants WHERE id = target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Prevent JSONB Permission Injection (Mandate #10)
-- Blocks any role from manually injecting "super_admin": true into permission objects
ALTER TABLE governance.permissions
ADD CONSTRAINT block_super_admin_injection
CHECK (
    NOT (resource_permissions ? 'super_admin') 
    AND (resource_permissions::text !~* 'super_admin')
);

-- 3. Quota Enforcement Trigger (Mandate #6)
CREATE OR REPLACE FUNCTION storefront.enforce_quota_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count BIGINT;
    max_limit INT;
    quota_column TEXT;
BEGIN
    -- Infer quota column based on table name
    IF TG_TABLE_NAME = 'products' THEN quota_column := 'max_products';
    ELSIF TG_TABLE_NAME = 'orders' THEN quota_column := 'max_orders';
    ELSIF TG_TABLE_NAME = 'staff' THEN quota_column := 'max_staff';
    ELSE RETURN NEW;
    END IF;

    -- Get Limit
    EXECUTE format('SELECT %I FROM governance.tenant_quotas WHERE tenant_id = $1', quota_column)
    INTO max_limit USING NEW.tenant_id;

    -- Get Current Count
    EXECUTE format('SELECT count(*) FROM %I.%I WHERE tenant_id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    INTO current_count USING NEW.tenant_id;

    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'Quota Violation: % limit reached (%/%). Upgrade required.', quota_column, current_count, max_limit
        USING ERRCODE = 'P0009';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Feature Gate Enforcement Trigger (Mandate #7)
CREATE OR REPLACE FUNCTION storefront.enforce_feature_gate()
RETURNS TRIGGER AS $$
DECLARE
    feature_key TEXT;
    is_enabled BOOLEAN;
BEGIN
    -- Map table to feature key
    IF TG_TABLE_NAME = 'b2b_price_tiers' THEN feature_key := 'b2b';
    ELSIF TG_TABLE_NAME = 'affiliates' THEN feature_key := 'marketing_advanced';
    ELSE RETURN NEW;
    END IF;

    SELECT f.is_enabled INTO is_enabled 
    FROM governance.feature_gates f 
    WHERE f.tenant_id = NEW.tenant_id AND f.feature_key = feature_key;

    IF NOT COALESCE(is_enabled, false) THEN
        RAISE EXCEPTION 'Feature Violation: % module is disabled for this tenant.', feature_key
        USING ERRCODE = 'P0010';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
