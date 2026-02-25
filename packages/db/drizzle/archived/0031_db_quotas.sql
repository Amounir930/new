-- Mandate #11: Zero-Trust Quota Enforcement
-- Prevents INSERT operations that exceed tenant limits, even via direct SQL bypass.

CREATE OR REPLACE FUNCTION governance.enforce_tenant_quota()
RETURNS TRIGGER AS $$
DECLARE
    current_count INT;
    max_limit INT;
    tenant_id_val UUID;
BEGIN
    -- 1. Resolve Tenant ID from context
    tenant_id_val := current_setting('app.current_tenant', true)::UUID;
    
    IF tenant_id_val IS NULL THEN
        RAISE EXCEPTION 'S2 Violation: Cannot enforce quota without app.current_tenant context';
    END IF;

    -- 2. Check Quota for products (Example)
    IF TG_TABLE_NAME = 'products' THEN
        SELECT max_products INTO max_limit FROM governance.tenant_quotas WHERE tenant_id = tenant_id_val;
        
        -- Default to 0 if no quota record exists (Safe failure)
        IF max_limit IS NULL THEN max_limit := 0; END IF;

        SELECT COUNT(*) INTO current_count FROM products WHERE deleted_at IS NULL;

        IF current_count >= max_limit THEN
            RAISE EXCEPTION 'Governance Violation: Product quota exceeded (%)', max_limit
            USING ERRCODE = 'P0001'; -- Custom error code for app handling
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to products table in all schemas via a dynamic migration strategy
-- For now, we define the trigger in the template
-- Note: In a real system, we'd add this to the tenant schema creation blueprint.
