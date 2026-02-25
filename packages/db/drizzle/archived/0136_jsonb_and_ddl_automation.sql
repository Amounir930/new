-- 🚨 FATAL LOCKDOWN: Phase II — JSONB Protection & DDL Automation
-- 0136_jsonb_and_ddl_automation.sql

-- 1. JSONB DoS Protection (Risk #25)
-- Mandate: Apply pg_column_size limit < 1MB to ALL JSONB columns in the system.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE data_type = 'jsonb'
        AND table_schema IN ('storefront', 'governance', 'vault')
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK (pg_column_size(%I) < 1048576)', 
            r.table_schema, r.table_name, 'chk_' || r.column_name || '_size', r.column_name);
    END LOOP;
END $$;

-- 2. DDL Event Trigger for updated_at (Risk #31)
-- Mandate: Automatically ensure every new table in storefront has an updated_at trigger.
CREATE OR REPLACE FUNCTION governance.auto_attach_updated_at()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.command_tag = 'CREATE TABLE' AND obj.schema_name = 'storefront' THEN
            -- Check if updated_at column exists
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = obj.schema_name AND table_name = obj.object_name AND column_name = 'updated_at'
            ) THEN
                EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 
                    obj.object_name, obj.schema_name, obj.object_name);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Policy Idempotency Helper (Risk #18)
-- Mandate: Provide a helper to drop policies before creation to prevent definition mismatch errors.
CREATE OR REPLACE FUNCTION governance.drop_policy_if_exists(p_table TEXT, p_policy TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy, p_table);
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Phase II: JSONB Protection & DDL Automation Applied.';
