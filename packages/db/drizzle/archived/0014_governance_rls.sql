-- 🛡️ V6 FATAL AUDIT - GOVERNANCE RLS (MANDATE #2)
-- Enforces RLS on the governance schema. Only super admins can read or write.

DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'governance'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE governance.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
        
        -- Drop existing policy
        EXECUTE format('DROP POLICY IF EXISTS governance_super_admin_only ON governance.%I;', tbl.tablename);

        -- Create pure super admin policy
        EXECUTE format(
            'CREATE POLICY governance_super_admin_only 
             ON governance.%I FOR ALL 
             USING (current_setting(''app.role'', false) = ''super_admin'');',
            tbl.tablename
        );
    END LOOP;
END $$;
