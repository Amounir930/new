-- 🏗️ Apex v2 — Advanced Partitioning & High-Performance Tuning
-- Standard: Stripe/Shopify Enterprise Database Guidelines

-- 1. CLEANUP OLD TABLES
DROP TABLE IF EXISTS governance.audit_logs_old CASCADE;
DROP TABLE IF EXISTS outbox_events_old CASCADE;

-- 2. PARTITIONED AUDIT LOGS (Monthly)
-- Re-creating with RANGE partitioning support
CREATE TABLE IF NOT EXISTS governance.audit_logs_partitioned (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    severity audit_severity NOT NULL DEFAULT 'INFO',
    result audit_result NOT NULL DEFAULT 'SUCCESS',
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

-- Initial Monthly Partitions
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m01 PARTITION OF governance.audit_logs_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m02 PARTITION OF governance.audit_logs_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m03 PARTITION OF governance.audit_logs_partitioned
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- 3. PARTITIONED OUTBOX EVENTS (Weekly)
-- Optimizing for high-frequency cleanup/retention
CREATE TABLE IF NOT EXISTS outbox_events_partitioned (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status outbox_status NOT NULL DEFAULT 'pending',
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Initial Weekly Partitions (February/March 2026)
CREATE TABLE IF NOT EXISTS outbox_events_w08 PARTITION OF outbox_events_partitioned
    FOR VALUES FROM ('2026-02-23') TO ('2026-03-02');
CREATE TABLE IF NOT EXISTS outbox_events_w09 PARTITION OF outbox_events_partitioned
    FOR VALUES FROM ('2026-03-02') TO ('2026-03-09');

-- 4. PERFORMANCE TUNING (Decision #20)
ALTER TABLE inventory_levels SET (fillfactor = 80);
ALTER TABLE outbox_events_partitioned SET (fillfactor = 70);
ALTER TABLE governance.audit_logs_partitioned SET (fillfactor = 70);

-- 5. ADVANCED INDEXES
-- HNSW for Vector Search (Applied to products table)
-- Requires native SQL due to HNSW parameter complexities in Drizzle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_embedding_hnsw') THEN
        CREATE INDEX idx_products_embedding_hnsw ON products USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    END IF;
END $$;

-- Trigram GIN indices for i18n search (fuzzy matching)
-- CREATE INDEX idx_products_name_ar_trgm ON products USING GIN ((name->>'ar') gin_trgm_ops);
-- CREATE INDEX idx_products_name_en_trgm ON products USING GIN ((name->>'en') gin_trgm_ops);
