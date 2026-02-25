-- 🚨 V8 Automation Hardening: 0051_automation_v2_event_triggers.sql

-- 1. Schema Drift Logging (V8 Point #36)
CREATE TABLE IF NOT EXISTS governance.schema_drift_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_tag TEXT,
    object_type TEXT,
    object_identity TEXT,
    actor_id TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE FUNCTION governance.log_schema_drift()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    -- Audit 999 Point #11: Prevent drift by unauthorized users
    IF current_user != 'postgres' AND current_setting('app.role', true) != 'super_admin' THEN
        RAISE EXCEPTION 'S1 Violation: Unauthorized DDL attempt. Only Super Admin can modify schema.' 
        USING ERRCODE = 'P9999';
    END IF;

    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        INSERT INTO governance.schema_drift_log (command_tag, object_type, object_identity, actor_id)
        VALUES (obj.command_tag, obj.object_type, obj.object_identity, current_user);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Automated Trigger Attachment (V8 Point #4 Pattern)
-- Note: PostgreSQL event triggers for 'CREATE TABLE' work at the command end.

CREATE OR REPLACE FUNCTION governance.auto_attach_security_triggers()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        -- Only target tenant schemas
        IF obj.schema_name ~ '^tenant_' AND obj.object_type = 'table' THEN
            -- Attach RLS (already handled by 0099, but this handles future tables)
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', obj.schema_name, obj.object_name);
            
            -- Attach Quota Trigger (Pattern)
            IF obj.object_name IN ('products', 'orders') THEN
                EXECUTE format('
                    CREATE TRIGGER trg_quota_enforcement 
                    BEFORE INSERT ON %I.%I 
                    FOR EACH ROW EXECUTE FUNCTION storefront.enforce_quota_limit()
                ', obj.schema_name, obj.object_name);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Event Trigger Creation (Requires Superuser)
-- DROP EVENT TRIGGER IF EXISTS trg_log_drift;
CREATE EVENT TRIGGER trg_log_drift ON ddl_command_end EXECUTE FUNCTION governance.log_schema_drift();

-- DROP EVENT TRIGGER IF EXISTS trg_auto_attach;
-- CREATE EVENT TRIGGER trg_auto_attach ON ddl_command_end WHEN TAG IN ('CREATE TABLE') EXECUTE FUNCTION governance.auto_attach_security_triggers();
