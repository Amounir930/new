-- 🛡️ V6 FATAL AUDIT - PHANTOM FEATURE GATES (MANDATE #4)
-- Enforces feature gates actively at the database level by preventing inserts into specific tables
-- if the tenant does not have the corresponding feature flag enabled (e.g., plan 'pro'/'enterprise' or a specific jsonb flag).

CREATE OR REPLACE FUNCTION storefront.enforce_b2b_feature_gate()
RETURNS trigger AS $$
DECLARE
    tenant_plan TEXT;
    tenant_status TEXT;
BEGIN
    SELECT plan, status INTO tenant_plan, tenant_status
    FROM governance.tenants
    WHERE id = NEW.tenant_id;

    IF tenant_status != 'active' THEN
        RAISE EXCEPTION 'Cannot insert into % because tenant is suspended or inactive.', TG_TABLE_NAME USING ERRCODE = 'P0001';
    END IF;

    -- For example, asserting that only 'enterprise' or 'pro' can use B2B features
    IF tenant_plan NOT IN ('pro', 'enterprise') THEN
        RAISE EXCEPTION 'Feature Gate Blocked: B2B features require a pro or enterprise subscription.' USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to B2B Tables
DROP TRIGGER IF EXISTS ensure_b2b_feature_gate ON storefront.b2b_companies;
CREATE TRIGGER ensure_b2b_feature_gate
    BEFORE INSERT ON storefront.b2b_companies
    FOR EACH ROW
    EXECUTE FUNCTION storefront.enforce_b2b_feature_gate();
