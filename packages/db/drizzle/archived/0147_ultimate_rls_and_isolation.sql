-- 🚨 FATAL FORENSIC LOCKDOWN: Phase V — The Ultimate Isolation
-- 0147_ultimate_rls_and_isolation.sql

-- 1. Fail-Hard RLS Policy Rewrite (Risk #99)
-- Mandate: Ensure absolute rejection if tenant context is missing.
DO $$ 
DECLARE 
    r RECORD;
    v_new_qual TEXT;
BEGIN
    FOR r IN (
        SELECT policyname, tablename, schemaname, qual
        FROM pg_policies 
        WHERE qual ~ 'current_setting' AND (qual ~ 'true' OR qual NOT ~ 'false')
    ) LOOP
        -- Replace true with false, or add false if missing
        IF r.qual ~ 'true' THEN
            v_new_qual := REPLACE(r.qual, '''true''', '''false''');
        ELSE
            v_new_qual := REPLACE(r.qual, ')', ', false)');
        END IF;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        EXECUTE format('CREATE POLICY %I ON %I.%I USING (%s)', r.policyname, r.schemaname, r.tablename, v_new_qual);
        RAISE NOTICE 'Phase V: Hard-locked policy % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- 2. Schema Name Sanitization (Risk #Core-S01)
-- Mandate: Block reserved PostgreSQL identifiers.
CREATE OR REPLACE FUNCTION public.validate_schema_name(p_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF p_name IN ('public', 'governance', 'vault', 'pg_catalog', 'information_schema', 'partman', 'cron') THEN
        RAISE EXCEPTION 'Fatal Violation: Reserved schema name injection attempt: %', p_name
        USING ERRCODE = 'P0002';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Infallible Search Path (Risk #S2)
-- Mandate: Force public schema for sensitive governance operations.
ALTER ROLE postgres SET search_path TO public, governance, vault;

-- 4. Global DDL Block Function (Preparing for Event Trigger)
CREATE OR REPLACE FUNCTION governance.block_audit_truncate_event()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.command_tag IN ('TRUNCATE', 'DROP TABLE') AND 
           (obj.schema_name IN ('storefront', 'governance', 'vault') OR obj.object_identity ~ 'audit_logs') THEN
            RAISE EXCEPTION 'Fatal Violation: Global Destruction Block (#37) triggered for % on %', 
                obj.command_tag, obj.object_identity
                USING ERRCODE = 'P0002';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Phase V: Ultimate Isolation Applied.';
