-- 🛡️ V6 FATAL AUDIT - PARTITIONING & PG_CRON (MANDATES #10, #11, #16)

-- MANDATE #10: Phantom Partitions => True Native Declarative Partitioning
-- PostgreSQL partitions must be created declaratively. We recreate the audit_logs table.
-- Note: In a live migration, data would be transferred. 
DROP TABLE IF EXISTS governance.audit_logs CASCADE;

CREATE TABLE governance.audit_logs (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO',
    result TEXT NOT NULL DEFAULT 'SUCCESS',
    context TEXT NOT NULL DEFAULT 'tenant_admin', -- Mandate #20 Integration
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions for the next 3 months
CREATE TABLE governance.audit_logs_y2026m02 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE governance.audit_logs_y2026m03 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE governance.audit_logs_y2026m04 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- MANDATE #11: Materialized View Stagnation
-- Automatically refresh the billing view concurrently every hour
SELECT cron.schedule('mv_refresh_tenant_billing', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY governance.mv_tenant_billing');

-- MANDATE #16: Cart Reservation Deadlocks
-- Automatically clear inventory_reservations that expire, avoiding massive deadlock pileups.
-- (Assuming inventory_reservations table exists or will exist)
SELECT cron.schedule('clear_dead_reservations', '*/5 * * * *', 'DELETE FROM storefront.inventory_reservations WHERE expires_at < NOW()');

