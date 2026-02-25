-- 🚨 FATAL LOCKDOWN: Phase III — Automation & JSONB Guard
-- 0140_final_automation_provisioning.sql

-- 1. pg_partman Global Integration (Risk #2)
DO $$ 
BEGIN
    -- Ensure schema exists
    CREATE SCHEMA IF NOT EXISTS partman;
    CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;

    -- Automate audit_logs
    PERFORM partman.create_parent('governance.audit_logs', 'created_at', 'native', 'monthly', p_premake := 3);
    
    -- Automate payment_logs
    PERFORM partman.create_parent('storefront.payment_logs', 'created_at', 'native', 'daily', p_premake := 7);

    -- Automate app_usage_records
    PERFORM partman.create_parent('governance.app_usage_records', 'created_at', 'native', 'monthly', p_premake := 3);
END $$;

-- 2. Idempotent pg_cron Jobs (Risk #15)
DO $$ 
BEGIN
    -- Maintenance Sweep
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'partman_maintenance') THEN
        PERFORM cron.schedule('partman_maintenance', '0 * * * *', 'SELECT partman.run_maintenance()');
    END IF;

    -- Sequence Cleanup (Risk #12)
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sequence_cleanup') THEN
        PERFORM cron.schedule('sequence_cleanup', '0 3 * * *', 
            $$DELETE FROM storefront.tenant_sequences WHERE last_used_at < NOW() - INTERVAL '90 days'$$);
    END IF;
END $$;

-- 3. Atomic Quota Maintenance (Risk #11)
CREATE OR REPLACE FUNCTION governance.maintain_tenant_quota_counters_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Risk #11: BEFORE INSERT + FOR UPDATE to ensure atomicity
    UPDATE governance.tenant_quotas 
    SET current_usage = current_usage + 1,
        updated_at = NOW()
    WHERE tenant_id = current_setting('app.current_tenant')::uuid
    AND quota_type = TG_ARGV[0];
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Global JSONB DoS Protection (Risk #14)
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
        -- Remove old constraint if exists to be idempotent
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', r.table_schema, r.table_name, 'chk_' || r.column_name || '_size');
        -- Apply 1MB limit
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK (pg_column_size(%I) < 1048576)', 
            r.table_schema, r.table_name, 'chk_' || r.column_name || '_size', r.column_name);
    END LOOP;
END $$;

RAISE NOTICE 'Phase III: Automation & JSONB Guard Applied.';
