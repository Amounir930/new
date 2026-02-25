-- 🚨 FATAL LOCKDOWN: Phase III — Final Gaps & Refinement
-- 0141_final_compliance_refinement.sql

-- 1. Extension Versioning (Risk #23)
CREATE EXTENSION IF NOT EXISTS vector WITH VERSION '0.5.0';
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. DDL Event Trigger for updated_at & UTC (Risk #39, #103)
CREATE OR REPLACE FUNCTION governance.attach_standard_triggers()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.command_tag = 'CREATE TABLE' AND obj.schema_name = 'storefront' THEN
            -- 1. updated_at Trigger
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = obj.schema_name AND table_name = obj.object_name AND column_name = 'updated_at') THEN
                EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', obj.object_name, obj.schema_name, obj.object_name);
            END IF;
            
            -- 2. UTC Enforcement Trigger (placeholder for existing function)
            -- EXECUTE format('CREATE TRIGGER trg_%I_utc BEFORE INSERT OR UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION governance.force_utc_timestamp()', obj.object_name, obj.schema_name, obj.object_name);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Deferred FKs for Financial Tables (Risk #9)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname, relname as tablename, nspname as schemaname
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = cl.relnamespace
        WHERE nspname = 'storefront' AND relname ~ 'order'
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED', r.schemaname, r.tablename, r.conname);
    END LOOP;
END $$;

-- 4. Audit Log Read Verification (Risk #104)
CREATE OR REPLACE VIEW governance.vw_verified_audit_logs AS
SELECT 
    *,
    CASE 
        WHEN checksum = governance.calculate_audit_checksum(id, old_values, new_values, created_at) THEN TRUE 
        ELSE FALSE 
    END as is_integrity_valid
FROM governance.audit_logs;

-- 5. Outbox Failure Notification (Risk #125)
CREATE OR REPLACE FUNCTION storefront.trg_outbox_notify_failure()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        PERFORM pg_notify('outbox_failed', jsonb_build_object(
            'event_type', NEW.event_type,
            'tenant_id', NEW.tenant_id,
            'id', NEW.id
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_outbox_notify ON storefront.outbox;
CREATE TRIGGER trg_outbox_notify
AFTER UPDATE ON storefront.outbox
FOR EACH ROW EXECUTE FUNCTION storefront.trg_outbox_notify_failure();

RAISE NOTICE 'Phase III: Final Compliance Refinement Applied.';
