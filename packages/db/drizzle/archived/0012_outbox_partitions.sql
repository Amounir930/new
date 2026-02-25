-- 🛡️ V6 RED TEAM AUDIT - OUTBOX PARTITIONING (MANDATE #19)

-- MANDATE #19: Phantom Partitions => True Native Declarative Partitioning
-- PostgreSQL partitions must be created declaratively. We recreate the outbox_events table.
DROP TABLE IF EXISTS storefront.outbox_events CASCADE;

CREATE TABLE storefront.outbox_events (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending',
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB,
    PRIMARY KEY (id, created_at),
    -- Mandate #36: Idempotency protection (must include partition key)
    UNIQUE (tenant_id, aggregate_id, aggregate_type, event_type, created_at)
) PARTITION BY RANGE (created_at);

-- Set high-throughput fillfactor as instructed by original schema
ALTER TABLE storefront.outbox_events SET (fillfactor = 70);

-- Create initial partitions for the next 3 months
CREATE TABLE storefront.outbox_events_y2026m02 PARTITION OF storefront.outbox_events FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE storefront.outbox_events_y2026m03 PARTITION OF storefront.outbox_events FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE storefront.outbox_events_y2026m04 PARTITION OF storefront.outbox_events FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- Add BRIN indexing to partitioned parent map (Mandate #18)
CREATE INDEX idx_outbox_created_brin ON storefront.outbox_events USING brin (created_at);
