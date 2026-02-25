-- Mandate #18: Tenant Hard Delete Safeguard
-- Prevents accidental deletion of tenants that still have critical associated data.

CREATE OR REPLACE FUNCTION governance.prevent_unsafe_tenant_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_order_count INTEGER;
    v_customer_count INTEGER;
    v_schema_name TEXT;
BEGIN
    -- Mandate #6: Fix context for DELETE trigger
    IF (TG_OP != 'DELETE') THEN
        RETURN NEW;
    END IF;

    -- 1. Resolve schema name from OLD record
    v_schema_name := 'tenant_' || replace(OLD.subdomain, '-', '_');

    -- 2. Verify schema actually exists before attempting query
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema_name) THEN
        -- 3. Check if the schema has active orders
        BEGIN
            EXECUTE format('SELECT count(*) FROM %I.orders', v_schema_name) INTO v_order_count;
        EXCEPTION WHEN OTHERS THEN
            v_order_count := 0;
        END;

        -- 4. Check for customers
        BEGIN
            EXECUTE format('SELECT count(*) FROM %I.customers WHERE deleted_at IS NULL', v_schema_name) INTO v_customer_count;
        EXCEPTION WHEN OTHERS THEN
            v_customer_count := 0;
        END;

        -- 5. Enforce Safety
        IF v_order_count > 0 OR v_customer_count > 0 THEN
            RAISE EXCEPTION 'UNSAFE_DELETE: Tenant % still has % orders and % customers. Perform data archiving first.', 
                OLD.id, v_order_count, v_customer_count
            USING ERRCODE = 'P0002';
        END IF;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attachment:
DROP TRIGGER IF EXISTS trg_tenant_delete_safety ON governance.tenants;

CREATE TRIGGER trg_tenant_delete_safety
BEFORE DELETE ON governance.tenants
FOR EACH ROW
EXECUTE FUNCTION governance.prevent_unsafe_tenant_delete();
