-- 🚨 FATAL LOCKDOWN: Phase II — Partition Automation
-- 0134_automation_v3.sql

-- 1. pg_partman Integration (Risk #7)
-- Mandate: Automate partition creation for high-volume logs.
CREATE SCHEMA IF NOT EXISTS partman;
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;

-- Initialize partitioning for audit_logs
SELECT partman.create_parent(
    p_parent_table := 'governance.audit_logs',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := 'monthly',
    p_premake := 3
);

-- Initialize partitioning for app_sessions
SELECT partman.create_parent(
    p_parent_table := 'storefront.app_sessions',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := 'daily',
    p_premake := 7
);

-- 2. Idempotent pg_cron Scheduling (Risk #11)
-- Mandate: Ensure cron jobs don't error on re-run.
DO $$ 
BEGIN
    -- Maintenance Sweep (pg_partman)
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'partman_maintenance') THEN
        PERFORM cron.schedule('partman_maintenance', '0 * * * *', 'SELECT partman.run_maintenance()');
    END IF;

    -- Sequence Cleanup (Risk #15)
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sequence_cleanup') THEN
        PERFORM cron.schedule('sequence_cleanup', '0 3 * * *', 
            $$DELETE FROM storefront.tenant_sequences WHERE last_used_at < NOW() - INTERVAL '90 days'$$);
    END IF;

    -- Bloat Alerting (Risk #20)
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bloat_alert') THEN
        PERFORM cron.schedule('bloat_alert', '0 * * * *', 
            $$SELECT pg_notify('ops_alert', 'High table bloat detected') FROM vw_table_bloat WHERE n_dead_tup > 10000 LIMIT 1$$);
    END IF;
END $$;

RAISE NOTICE 'Phase II: Partition Automation & Idempotent Cron Applied.';
