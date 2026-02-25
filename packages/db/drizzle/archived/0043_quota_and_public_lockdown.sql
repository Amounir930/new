-- Mandate #30: Disable Default Public Schema Creation
-- Prevents accidental table creation in public schema which is reserved for global governance.

REVOKE CREATE ON SCHEMA public FROM public;

-- Mandate #11: Quota Enforcement Triggers
-- Strictly enforces subscription-based limits (products, orders) at the DB level.

CREATE OR REPLACE FUNCTION governance.enforce_tenant_quota()
RETURNS TRIGGER AS $$
DECLARE
    t_id UUID;
    q_limit INTEGER;
    curr_count INTEGER;
    quota_key TEXT;
BEGIN
    t_id := current_setting('app.current_tenant', true)::uuid;
    
    -- Super admin bypass
    IF current_setting('app.role', true) = 'super_admin' THEN
        RETURN NEW;
    END IF;

    -- Map table to quota key
    IF TG_TABLE_NAME = 'products' THEN
        quota_key := 'max_products';
    ELSIF TG_TABLE_NAME = 'orders' THEN
        quota_key := 'max_orders';
    ELSE
        RETURN NEW;
    END IF;

    -- Get limit from governance
    EXECUTE format('SELECT %I FROM governance.tenant_quotas WHERE tenant_id = $1', quota_key)
    INTO q_limit USING t_id;

    IF q_limit IS NULL THEN
        RETURN NEW; -- No limit set
    END IF;

    -- Get current count
    EXECUTE format('SELECT count(*) FROM %I.%I', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    INTO curr_count;

    IF curr_count >= q_limit THEN
        RAISE EXCEPTION 'S5 Violation: Tenant % has exceeded % limit (%)', t_id, quota_key, q_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all existing tenant schemas
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM information_schema.schemata WHERE schema_name ~ '^tenant_' LOOP
        EXECUTE format('CREATE TRIGGER trg_quota_products_%s BEFORE INSERT ON %I.products FOR EACH STATEMENT EXECUTE FUNCTION governance.enforce_tenant_quota()', r.schema_name, r.schema_name);
        EXECUTE format('CREATE TRIGGER trg_quota_orders_%s BEFORE INSERT ON %I.orders FOR EACH STATEMENT EXECUTE FUNCTION governance.enforce_tenant_quota()', r.schema_name, r.schema_name);
    END LOOP;
END $$;
