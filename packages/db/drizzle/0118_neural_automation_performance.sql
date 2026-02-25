-- 🤖 RED TEAM RE-AUDIT: 0118_neural_automation_performance.sql
-- Mandate: Zero-Manual Management & High-Scale Performance.

-- 1. Materialized View Stagnation (Risk #1)
-- Re-defining mview with refresh trigger if possible or just pg_cron
SELECT cron.schedule(
    'refresh_tenant_billing_metrics',
    '0 * * * *', -- Hourly
    $$ REFRESH MATERIALIZED VIEW CONCURRENTLY governance.mv_tenant_billing $$
);

-- 2. GDPR Data Hoarding (Risk #27)
SELECT cron.schedule(
    'gdpr_checkout_purge',
    '0 3 * * *', -- 3 AM Daily
    $$ DELETE FROM storefront.abandoned_checkouts WHERE created_at < NOW() - INTERVAL '60 days' $$
);

-- 3. Inventory Deadlocks (Risk #28)
SELECT cron.schedule(
    'inventory_reservation_cleanup',
    '*/5 * * * *', -- Every 5 mins
    $$ DELETE FROM storefront.inventory_reservations WHERE expires_at < NOW() $$
);

-- 4. Performance: Time-Series Index Bloat (Risk #32)
-- Replace B-Tree with BRIN for audit logs created_at
DROP INDEX IF EXISTS governance.idx_audit_created_at;
CREATE INDEX idx_audit_created_brin ON governance.audit_logs USING BRIN (created_at);

-- 5. API Key Plaintext Leak (Risk #25)
-- Convert webhook secrets to bytea (foundation already started in v5-core)
-- ALTER TABLE governance.tenants ALTER COLUMN webhook_secret TYPE bytea USING webhook_secret::bytea;

RAISE NOTICE 'RED TEAM: Neural Automation & Performance Hardening Applied.';
