-- Mandate #2: Raw SQL RLS Policies
-- Mandate #3: Natively block suspended tenants
-- Mandate #4: Super Admin bypass

-- NOTE: This migration assumes all storefront tables are in schemas matching 'tenant_%'
-- However, since Drizzle creates tables in the schema designated at runtime,
-- we apply policies to the tables in the current schema context.

DO $$ 
DECLARE 
    r RECORD;
    table_name_text TEXT;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname ~ '^tenant_[a-z0-9_]+$'
    LOOP
        table_name_text := quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.schemaname, r.tablename);

        -- Drop existing policies to prevent conflict with 0099
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I.%I', r.schemaname, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I.%I', r.schemaname, r.tablename);

        -- Create Policy
        -- Mandate #1: current_setting('app.current_tenant') throws error if missing
        -- Mandate #4: Hard Status Verification in every query
        -- Mandate #7: Soft-delete enforcement at DB level
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %s
            FOR ALL
            USING (
                (current_setting(''app.role'', true) = ''super_admin'')
                OR 
                (
                    tenant_id = current_setting(''app.current_tenant'')::uuid
                    AND (
                        NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_schema = %L AND table_name = %L AND column_name = ''deleted_at''
                        )
                        OR deleted_at IS NULL
                    )
                    AND EXISTS (
                        SELECT 1 FROM governance.tenants 
                        WHERE id = tenant_id AND status = ''active''
                    )
                )
            )', table_name_text, r.schemaname, r.tablename);
    END LOOP;
END $$;
