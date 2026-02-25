-- 🛡️ V6 FATAL AUDIT - MATERIALIZED VIEW STAGNATION (MANDATE #5)
-- Schedules hourly concurrent refreshes of mv_tenant_billing via pg_cron

-- Ensure the extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the concurrent refresh
-- Note: CONCURRENTLY requires a unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tenant_billing_tenant ON governance.mv_tenant_billing (tenant_id);

SELECT cron.schedule(
    'refresh_tenant_billing_hourly',
    '0 * * * *', -- At minute 0 past every hour
    $$ REFRESH MATERIALIZED VIEW CONCURRENTLY governance.mv_tenant_billing; $$
);
