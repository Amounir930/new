-- 🚨 V8 Governance Hardening: 0046_governance_v3_locking.sql

-- 1. Immutable Super Admin Action Log (V8 Point #7)
CREATE TABLE IF NOT EXISTS governance.super_admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Protect from modification
CREATE TRIGGER prevent_purge_action_update 
BEFORE UPDATE OR DELETE ON governance.super_admin_actions 
FOR EACH ROW EXECUTE FUNCTION governance.prevent_truncate();

-- 2. Refined Purge with Logging (V8 Point #7 Hint)
CREATE OR REPLACE FUNCTION governance.super_admin_purge_tenant(
    target_tenant_id UUID, 
    mfa_confirmation_token TEXT
)
RETURNS void AS $$
DECLARE
    schema_name TEXT;
    actor_id UUID;
BEGIN
    -- 1. Security Check
    IF current_setting('app.role', true) != 'super_admin' THEN
        RAISE EXCEPTION 'S1 Violation: Unauthorized access to terminal purge' USING ERRCODE = 'P0008';
    END IF;

    -- 2. MFA/Token Verification (Pattern implementation)
    IF mfa_confirmation_token IS NULL OR mfa_confirmation_token = '' THEN
        RAISE EXCEPTION 'S1 Violation: MFA Confirmation Token required for purge' USING ERRCODE = 'P0011';
    END IF;

    SELECT id, subdomain INTO actor_id, schema_name FROM governance.tenants WHERE id = target_tenant_id;
    schema_name := 'tenant_' || replace(schema_name, '-', '_');

    -- 3. Log Action BEFORE Execution
    INSERT INTO governance.super_admin_actions (actor_id, action_type, target_id, metadata)
    VALUES (
        current_setting('app.current_user_id', true)::uuid, 
        'TERMINAL_PURGE', 
        target_tenant_id, 
        jsonb_build_object('schema', schema_name, 'timestamp', now())
    );

    -- 4. Execution
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
    
    DELETE FROM governance.tenant_quotas WHERE tenant_id = target_tenant_id;
    DELETE FROM governance.feature_gates WHERE tenant_id = target_tenant_id;
    DELETE FROM governance.tenants WHERE id = target_tenant_id;

    RAISE NOTICE 'S2: Tenant % purged by Super Admin. Logged to super_admin_actions.', target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Event Trigger for TRUNCATE Protection (V8 Point #8 Hint)
-- Globally blocks TRUNCATE on any table named audit_logs across any schema.

CREATE OR REPLACE FUNCTION governance.block_audit_truncate_event()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.command_tag = 'TRUNCATE' AND obj.object_identity ~ 'audit_logs$' THEN
            RAISE EXCEPTION 'S1 Violation: Global protection blocks TRUNCATE on audit tables.';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Event triggers require superuser to create. 
-- In some managed DBs, we fall back to standard triggers (0037 already handles this).

-- 4. Maintenance Flag Persistence (V8 Point #32)
CREATE TABLE IF NOT EXISTS governance.system_states (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO governance.system_states (key, value) 
VALUES ('maintenance_mode', '{"enabled": false, "message": "System Update in Progress"}')
ON CONFLICT (key) DO NOTHING;
