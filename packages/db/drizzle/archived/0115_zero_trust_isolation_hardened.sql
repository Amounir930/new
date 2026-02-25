-- 🚨 RED TEAM RE-AUDIT: 0115_zero_trust_isolation_hardened.sql
-- Mandate: Fail-Closed Context & Synchronous Status Enforcement.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. CLEANUP: Drop all existing historical isolation policies
    FOR r IN (
        SELECT policyname, tablename, schemaname 
        FROM pg_policies 
        WHERE policyname IN ('tenant_isolation', 'tenant_isolation_policy')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;

    -- 2. ENFORCEMENT: Apply Canonical Zero-Trust Isolation
    FOR r IN (
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema ~ '^tenant_' 
        AND table_type = 'BASE TABLE'
    ) LOOP
        -- Enable Hardened RLS
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.table_schema, r.table_name);
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.table_schema, r.table_name);

        -- Level 0 Hardening: Fail-Closed Context (missing context = DB CRASH)
        -- Synchronous Status Check: Suspended tenants cannot write via API bugs.
        -- Super Admin Bypass: Explicit role-based traversal.
        EXECUTE format('
            CREATE POLICY tenant_isolation ON %I.%I
            AS PERMISSIVE
            FOR ALL
            TO tenant_role
            USING (
                (
                    -- Risk #1: Force Hard DB Crash on context leaks (false = fail closed)
                    (tenant_id = current_setting(''app.current_tenant'', false)::uuid)
                    
                    -- Risk #2: Synchronous Status Check (Ghost Suspension)
                    AND EXISTS (
                        SELECT 1 FROM governance.tenants 
                        WHERE id = current_setting(''app.current_tenant'', false)::uuid 
                        AND status = ''active''
                    )
                )
                -- Risk #3: Super Admin Omnipotence
                OR (current_setting(''app.role'', true) = ''super_admin'')
            )
            WITH CHECK (
                (
                    (tenant_id = current_setting(''app.current_tenant'', false)::uuid)
                    AND EXISTS (
                        SELECT 1 FROM governance.tenants 
                        WHERE id = current_setting(''app.current_tenant'', false)::uuid 
                        AND status = ''active''
                    )
                )
                OR (current_setting(''app.role'', true) = ''super_admin'')
            )
        ', r.table_schema, r.table_name);
        
        RAISE NOTICE 'RED TEAM: Zero-Trust Isolation (Level 0) applied to %.%', r.table_schema, r.table_name;
    END LOOP;
END $$;
