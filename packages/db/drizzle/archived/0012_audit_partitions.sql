-- 🛡️ V6 FATAL AUDIT - AUDIT LOG PARTITIONING (MANDATE #34)
-- Enforces native declarative partitioning for the platform audit logs.

DROP TABLE IF EXISTS governance.audit_logs CASCADE;

CREATE TABLE governance.audit_logs (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    severity severity NOT NULL DEFAULT 'INFO',
    result audit_result NOT NULL DEFAULT 'SUCCESS',
    tenant_id TEXT NOT NULL,
    actor_type actor_type NOT NULL DEFAULT 'tenant_admin', -- Mandate #9: super_admin, tenant_admin, system
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

-- Create initial partitions
CREATE TABLE governance.audit_logs_y2026m02 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE governance.audit_logs_y2026m03 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- BRIN Index for time-series (Mandate #37)
CREATE INDEX idx_audit_created_brin ON governance.audit_logs USING brin (created_at);

CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;
SELECT partman.create_parent('governance.audit_logs', 'created_at', 'native', 'monthly', p_premake := 3);
