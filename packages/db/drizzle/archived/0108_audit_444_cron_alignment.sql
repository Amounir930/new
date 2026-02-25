-- 🛡️ Audit 444 Cron Alignment: 0108_audit_444_cron_alignment.sql
-- Goal: Align existing cron jobs with the new logging wrapper.

-- 1. Unschedule existing raw jobs
SELECT cron.unschedule('sweep_abandoned_checkouts');
SELECT cron.unschedule('mv_refresh_tenant_billing');
SELECT cron.unschedule('clear_dead_reservations');

-- 2. Reschedule using the run_cron_job wrapper (Issue 8)

SELECT cron.schedule(
    'sweep_abandoned_checkouts',
    '0 2 * * *',
    $$ SELECT governance.run_cron_job('sweep_abandoned_checkouts', 'DELETE FROM storefront.abandoned_checkouts WHERE created_at < NOW() - INTERVAL ''60 days''') $$
);

SELECT cron.schedule(
    'mv_refresh_tenant_billing',
    '0 * * * *',
    $$ SELECT governance.run_cron_job('refresh_tenant_billing', 'REFRESH MATERIALIZED VIEW CONCURRENTLY governance.mv_tenant_billing') $$
);

SELECT cron.schedule(
    'clear_dead_reservations',
    '*/5 * * * *',
    $$ SELECT governance.run_cron_job('clear_dead_reservations', 'DELETE FROM storefront.inventory_reservations WHERE expires_at < NOW()') $$
);
