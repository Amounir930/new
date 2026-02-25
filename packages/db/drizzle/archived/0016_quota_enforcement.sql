-- Mandate #16: Zero-Trust Quota Enforcement
-- Prevents product insertion if tenant has exceeded their max_products limit.

CREATE OR REPLACE FUNCTION governance.enforce_product_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_limit INTEGER;
    v_current INTEGER;
BEGIN
    -- 1. Get the current limit for the tenant
    -- We assume the tenant context is set via app.current_tenant (Mandate #1)
    SELECT max_products INTO v_limit
    FROM governance.tenant_quotas
    WHERE tenant_id::text = current_setting('app.current_tenant', true)
    LIMIT 1;

    -- Default to 100 if no quota record exists
    IF v_limit IS NULL THEN
        v_limit := 100;
    END IF;

    -- 2. Count current active products (excluding soft-deleted)
    -- We use TG_TABLE_SCHEMA to count in the correct schema
    EXECUTE format('SELECT count(*) FROM %I.products WHERE deleted_at IS NULL', TG_TABLE_SCHEMA)
    INTO v_current;

    -- 3. Enforce limit
    IF v_current >= v_limit THEN
        RAISE EXCEPTION 'QUOTA_EXCEEDED: Product limit of % reached for tenant %', v_limit, current_setting('app.current_tenant', true)
        USING ERRCODE = 'P0001'; -- Custom error code for app handling
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: In a production environment, this trigger would be attached to every tenant schema's products table.
-- Deployment strategy: Add to the 'blueprint' schema or apply via migration runner to all existing schemas.

-- COMMENT ON FUNCTION governance.enforce_product_quota IS 'Zero-Trust product quota enforcement (Point #16)';
