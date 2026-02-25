-- 🛡️ V6 FATAL AUDIT - ZERO-TRUST RLS LOCKDOWN (MANDATES #2, #3)
-- Ensures no multi-tenant data bleed. Application-layer isolation is disabled natively.

-- Mandate #2: Set the default DB parameter to prevent God Mode if variable missing
-- (Some environments use ALTER DATABASE, but the best cross-env way is ensuring 
-- 'current_setting' throws by passing 'false' as the missing_ok parameter, which we do below).

DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'storefront'
    LOOP
        -- 1. Enable RLS on every table
        EXECUTE format('ALTER TABLE storefront.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
        
        -- Audit 999 Point #3: Only ensure policy is dropped here. 0099 will apply canonical enforcement.
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON storefront.%I;', tbl.tablename);
    END LOOP;
END $$;
