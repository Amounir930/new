-- 🚨 Audit 999 Infrastructure Consolidation: 0099_final_infra.sql

-- 1. Partitioning Consolidation (Audit Point #1)
-- Use pg_partman to handle partitioning canonically.
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA public;

-- Example: Governance Audit Logs
-- SELECT partman.create_parent('governance.audit_logs', 'created_at', 'native', 'daily');

-- 2. Cron Job Uniqueness & Centralization (Audit Point #18)
-- Ensure pg_cron jobs are uniquely named and centralized.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Weekly Reindexing (Point #11 from Audit 999 perspective or V8 context)
SELECT cron.schedule('weekly-reindex', '0 0 * * 0', $$ SELECT maintenance.weekly_bloat_reduction(); $$);

-- Daily Inventory Cleanup (Point #24 from Audit 999 perspective)
SELECT cron.schedule('daily-inventory-cleanup', '0 1 * * *', $$ SELECT storefront.cleanup_expired_reservations(1000); $$);

-- Daily Outbox Purge
SELECT cron.schedule('daily-outbox-purge', '0 2 * * *', $$ DELETE FROM storefront.outbox_events WHERE status = 'completed' AND created_at < now() - INTERVAL '7 days'; $$);

-- 3. Maintenance Flag Persistence (Persistence layer for Point #13/15)
-- (Already handled in 0046, but ensuring canonical presence)
CREATE TABLE IF NOT EXISTS governance.system_states (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
