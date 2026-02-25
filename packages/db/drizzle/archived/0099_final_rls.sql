-- 🚨 V8 Final Zero-Trust RLS: 0099_final_rls.sql
-- Mandate #1: Consolidate all RLS into a single idempotent enforcement layer.
-- This file drops all existing isolation policies and recreates them cleanly.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. CLEANUP: Drop all existing historical policy names to avoid naming conflicts
    FOR r IN (
        SELECT policyname, tablename, schemaname 
        FROM pg_policies 
        WHERE policyname IN ('tenant_isolation', 'tenant_isolation_policy', 'product_isolation')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;

    -- 2. ENFORCEMENT: Apply canonical isolation to every storefront table
    FOR r IN (
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema ~ '^tenant_' 
        AND table_type = 'BASE TABLE'
    ) LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.table_schema, r.table_name);
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.table_schema, r.table_name);

        -- Mandate #4 & #8: Multi-factor Policy (Tenant + Status + Soft Delete)
        EXECUTE format('
            CREATE POLICY tenant_isolation ON %I.%I
            AS PERMISSIVE
            FOR ALL
            TO tenant_role
            USING (
                (tenant_id = current_setting(''app.current_tenant'', false)::uuid)
                AND (EXISTS (
                    SELECT 1 FROM governance.tenants 
                    WHERE id = current_setting(''app.current_tenant'', false)::uuid 
                    AND status = ''active''
                ))
                AND (
                    CASE 
                        WHEN column_exists(%L, %L, ''deleted_at'') 
                        THEN (deleted_at IS NULL)
                        ELSE true 
                    END
                )
            )
            WITH CHECK (
                (tenant_id = current_setting(''app.current_tenant'', false)::uuid)
            )
        ', r.table_schema, r.table_name, r.table_schema, r.table_name);
        
        RAISE NOTICE 'S2: Idempotent isolation applied to %.%', r.table_schema, r.table_name;
    END LOOP;
END $$;

-- 3. LOCKDOWN: Revoke public traversal (V8 Point #18)
REVOKE USAGE ON SCHEMA governance FROM tenant_role;
REVOKE USAGE ON SCHEMA vault FROM tenant_role;
GRANT USAGE ON SCHEMA governance TO super_admin_role;

-- 4. BOOTSTRAP: Mandatory Public Lockdown (V8 Point #37)
REVOKE CREATE ON SCHEMA public FROM public;
RAISE NOTICE 'S2: Public schema restricted. God-mode traversal blocked.';
