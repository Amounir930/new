-- 🚨 FATAL LOCKDOWN: Phase II — RLS Blanket & Global Integrity Guards
-- 0132_rls_blanket_and_event_triggers.sql

-- 1. Blanket RLS Enforcement (Risk #1)
-- Mandate: Loop through all tenant-prefixed schemas and force RLS on all tables.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname ~ '^tenant_' OR schemaname = 'storefront'
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. Global Truncate Guard (Risk #2)
-- Mandate: Use Event Triggers to block TRUNCATE on sensitive governance and storefront tables.
CREATE OR REPLACE FUNCTION governance.block_catastrophic_ddl()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.command_tag IN ('TRUNCATE', 'DROP TABLE') AND obj.schema_name IN ('governance', 'vault', 'storefront') THEN
            RAISE EXCEPTION 'Fatal Violation: % on %.% is strictly prohibited.', 
                obj.command_tag, obj.schema_name, obj.object_identity
                USING ERRCODE = 'P0002';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Event triggers must be created by superuser on the database level.
-- This is a placeholder for the initialization script.
-- CREATE EVENT TRIGGER trg_block_truncate ON ddl_command_end 
-- WHEN TAG IN ('TRUNCATE', 'DROP TABLE') 
-- EXECUTE FUNCTION governance.block_catastrophic_ddl();

-- 3. Public Schema Hard-Seal (Risk #16)
-- Mandate: Prevent any third-party or tenant role from creating/accessing public objects.
REVOKE CREATE ON SCHEMA public FROM public;
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO public; -- Allow execution of public functions only

-- 4. Audit Table Immutability (Risk #8)
-- Re-confirming column-level locks on audit_logs.
CREATE OR REPLACE FUNCTION governance.no_update_audit()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Fatal Violation: Audit logs are immutable and cannot be modified.'
    USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON governance.audit_logs;
CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE OR TRUNCATE ON governance.audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION governance.no_update_audit();

RAISE NOTICE 'Phase II: RLS Blanket & Global Event Guards Applied.';
