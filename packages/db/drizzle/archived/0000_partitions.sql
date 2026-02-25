-- 🏗️ Apex v2 — Database Partitioning Strategy (Directive #14)
-- Scope: Audit Logs and Outbox Events.

-- 1. AUDIT LOGS PARTITIONING
-- Note: PostgreSQL requires partitioning at table creation time.
-- This script outlines the mandatory DDL for the migration lifecycle.

-- ALTER TABLE governance.audit_logs RENAME TO audit_logs_old;

-- CREATE TABLE governance.audit_logs (
--     id UUID NOT NULL,
--     created_at TIMESTAMPTZ(6) NOT NULL,
--     ... -- All other columns
-- ) PARTITION BY RANGE (created_at);

-- 2. OUTBOX EVENTS PARTITIONING
-- CREATE TABLE storefront.outbox_events (
--     id UUID NOT NULL,
--     created_at TIMESTAMPTZ(6) NOT NULL,
--     ...
-- ) PARTITION BY RANGE (created_at);

-- 3. INITIAL PARTITIONS EXAMPLE
-- CREATE TABLE governance.audit_logs_y2026m02 PARTITION OF governance.audit_logs
-- FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
