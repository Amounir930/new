-- 🏗️ Apex v2 — Database Partitioning Strategy (Mandate #17)
-- Scope: Audit Logs and Outbox Events.

-- 1. AUDIT LOGS PARTITIONING
-- PostgreSQL requires partitioning at table creation time.
-- This script provides the DDL template for the partitioned structure.

CREATE TABLE governance.audit_logs_partitioned (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL,
    severity TEXT NOT NULL,
    result TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
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

-- 2. INITIAL PARTITION EXAMPLE
CREATE TABLE governance.audit_logs_y2026m02 PARTITION OF governance.audit_logs_partitioned
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 3. OUTBOX EVENTS PARTITIONING
CREATE TABLE storefront.outbox_events_partitioned (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL,
    status TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
