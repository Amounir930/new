-- ═══════════════════════════════════════════════════════════════════
-- Apex v2 — Production Database Engineering Migration
-- ═══════════════════════════════════════════════════════════════════
--
-- This migration applies PostgreSQL-native optimizations that
-- Drizzle ORM cannot express. Run AFTER Drizzle migrations.
--
-- Sections:
--   1. Extensions
--   2. Schemas
--   3. FILLFACTOR (Hot Update optimization)
--   4. Autovacuum Tuning
--   5. CHECK Constraints
--   6. Deferred Foreign Keys (Bulk Import)
--   7. BRIN Indexes (Time-Series)
--   8. GIN Indexes (JSONB + Trigram)
--   9. HNSW Index (Vector Search)
--  10. HASH Index (Auth Token Lookup)
--  11. Table Partitioning
--  12. Materialized Views
--  13. PostGIS Upgrade
--  14. Maintenance Jobs (pg_cron)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Extensions ───────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;           -- pgvector for AI search
CREATE EXTENSION IF NOT EXISTS pg_trgm;          -- Trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_cron;          -- Scheduled jobs
-- CREATE EXTENSION IF NOT EXISTS postgis;       -- Uncomment when PostGIS is installed

-- ─── 2. Schemas ──────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS governance;
CREATE SCHEMA IF NOT EXISTS vault;               -- Isolated — excluded from pg_dump

-- ─── 3. FILLFACTOR ───────────────────────────────────────────────
-- Reduces page splits on frequently updated tables.
-- 80%: ~20% room for HOT updates. 70%: more aggressive for write-heavy.

ALTER TABLE inventory_levels       SET (fillfactor = 80);
ALTER TABLE inventory_reservations SET (fillfactor = 80);
ALTER TABLE outbox_events          SET (fillfactor = 70);
ALTER TABLE carts                  SET (fillfactor = 80);

-- ─── 4. Autovacuum Tuning ────────────────────────────────────────
-- outbox_events: massive INSERT+DELETE → aggressive vacuum

ALTER TABLE outbox_events SET (
  autovacuum_vacuum_scale_factor   = 0.01,   -- vacuum at 1% dead tuples (vs 20% default)
  autovacuum_analyze_scale_factor  = 0.005,  -- analyze at 0.5%
  autovacuum_vacuum_cost_delay     = 2       -- faster vacuum cycles (ms)
);

-- inventory_levels: frequent updates
ALTER TABLE inventory_levels SET (
  autovacuum_vacuum_scale_factor  = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- ─── 5. CHECK Constraints ────────────────────────────────────────
-- Database-level guards against invalid data.

-- Products: price validation
ALTER TABLE products
  ADD CONSTRAINT chk_products_price_positive
    CHECK (base_price > 0);

ALTER TABLE products
  ADD CONSTRAINT chk_products_compare_price
    CHECK (compare_at_price IS NULL OR compare_at_price > base_price);

-- Inventory: non-negative stock
ALTER TABLE inventory_levels
  ADD CONSTRAINT chk_inv_available_positive
    CHECK (available >= 0);

ALTER TABLE inventory_levels
  ADD CONSTRAINT chk_inv_reserved_positive
    CHECK (reserved >= 0);

-- Discount rules: date sanity
ALTER TABLE price_rules
  ADD CONSTRAINT chk_price_rules_dates
    CHECK (ends_at IS NULL OR ends_at > starts_at);

-- Metafields: 10KB size limit to prevent abuse
ALTER TABLE entity_metafields
  ADD CONSTRAINT chk_metafield_size
    CHECK (pg_column_size(value) <= 10240);

-- ─── 6. Deferred Foreign Keys (Bulk Import) ─────────────────────
-- Defer FK validation to end of transaction for 5x faster CSV imports.
-- Usage: SET CONSTRAINTS ALL DEFERRED; INSERT...; COMMIT;

ALTER TABLE products
  ALTER CONSTRAINT products_brand_id_brands_id_fk
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE products
  ALTER CONSTRAINT products_category_id_categories_id_fk
    DEFERRABLE INITIALLY DEFERRED;

-- ─── 7. BRIN Indexes (Time-Series) ──────────────────────────────
-- 1000× smaller than B-Tree for append-only time data.

-- Drop Drizzle-created B-Tree index on created_at, replace with BRIN
DROP INDEX IF EXISTS audit_logs_created_idx;
CREATE INDEX idx_audit_brin ON audit_logs
  USING BRIN (created_at) WITH (pages_per_range = 32);

DROP INDEX IF EXISTS idx_views_created;
CREATE INDEX idx_views_brin ON product_views
  USING BRIN (created_at) WITH (pages_per_range = 32);

CREATE INDEX idx_outbox_brin ON outbox_events
  USING BRIN (created_at) WITH (pages_per_range = 16);

-- ─── 8. GIN Indexes ─────────────────────────────────────────────

-- JSONB i18n name search (jsonb_path_ops = 4× smaller index)
DROP INDEX IF EXISTS idx_products_name;
CREATE INDEX idx_products_name_gin ON products
  USING GIN (name jsonb_path_ops);

-- Trigram indexes for fuzzy/typo-tolerant search
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm ON categories
  USING GIN ((name->>'ar') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_name_en_trgm ON categories
  USING GIN ((name->>'en') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON brands
  USING GIN ((name->>'ar') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_brands_name_en_trgm ON brands
  USING GIN ((name->>'en') gin_trgm_ops);

-- Metafields value search
CREATE INDEX IF NOT EXISTS idx_metafields_value_gin ON entity_metafields
  USING GIN (value);

-- Tags (GIN on TEXT array)
CREATE INDEX IF NOT EXISTS idx_products_tags_gin ON products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_orders_tags_gin ON orders USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_customers_tags_gin ON customers USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_blog_tags_gin ON blog_posts USING GIN (tags);

-- ─── 9. HNSW Index (Vector Semantic Search) ─────────────────────
-- 20× faster than IVFFlat, no periodic rebuild needed.

DROP INDEX IF EXISTS idx_products_embedding;
CREATE INDEX idx_products_hnsw ON products
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── 10. HASH Index (Auth Token Lookup) ─────────────────────────
-- Faster than B-Tree for exact equality lookups (auth flow).

DROP INDEX IF EXISTS idx_session_token;
CREATE INDEX idx_session_token_hash ON staff_sessions
  USING HASH (token_hash);

-- ─── 11. Table Partitioning ─────────────────────────────────────
-- NOTE: Partitioning requires re-creating tables.
-- These are CREATE statements ONLY for new deployments.
-- Existing deployments need data migration scripts.

-- 11a. audit_logs — Monthly partitions
-- Already defined in Drizzle; in production, convert to:
-- CREATE TABLE audit_logs (...) PARTITION BY RANGE (created_at);
-- Then auto-create partitions with pg_partman or manual:

-- Example: January 2026
CREATE TABLE IF NOT EXISTS audit_logs_2026_01
  PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_02
  PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_03
  PARTITION OF audit_logs
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- 11b. outbox_events — Daily partitions (auto-cleanup > 7 days)
-- See maintenance jobs below.

-- 11c. product_views — Monthly partitions
-- Same pattern as audit_logs.

-- 11d. payment_logs — Yearly partitions
-- Same pattern, yearly range.

-- ─── 12. Materialized Views ─────────────────────────────────────

-- Best Sellers (refreshed hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_best_sellers AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.base_price,
  p.main_image,
  COALESCE(SUM(oi.quantity), 0) AS total_sold
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
  AND o.status IN ('delivered', 'shipped')
  AND o.deleted_at IS NULL
WHERE p.is_active = true AND p.deleted_at IS NULL
GROUP BY p.id
ORDER BY total_sold DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_best_sellers_id
  ON mv_best_sellers (id);

-- Tenant Billing Metrics (refreshed hourly)
-- NOTE: In governance schema, this MV queries across tenant schemas.
-- Adapt query to your multi-tenant routing.

-- ─── 13. PostGIS Upgrade ─────────────────────────────────────────
-- Uncomment when PostGIS extension is available.

-- ALTER TABLE locations ADD COLUMN IF NOT EXISTS
--   geo GEOGRAPHY(POINT, 4326);

-- UPDATE locations SET geo = ST_MakePoint(
--   (coordinates->>'lng')::float,
--   (coordinates->>'lat')::float
-- )::geography WHERE coordinates IS NOT NULL;

-- CREATE INDEX idx_locations_geo ON locations USING GIST (geo);

-- Query: nearest warehouse to customer
-- SELECT * FROM locations
-- ORDER BY geo <-> ST_MakePoint(:lng, :lat)::geography
-- LIMIT 1;

-- ─── 14. Scheduled Maintenance Jobs (pg_cron) ───────────────────

-- 14a. Refresh materialized views hourly
SELECT cron.schedule('refresh-best-sellers', '0 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_best_sellers$$);

-- 14b. Expire inventory reservations every 2 minutes
SELECT cron.schedule('expire-reservations', '*/2 * * * *',
  $$UPDATE inventory_reservations
    SET status = 'expired'
    WHERE status = 'active' AND expires_at < now()$$);

-- 14c. GDPR: Hard delete abandoned checkouts > 60 days
SELECT cron.schedule('gdpr-cleanup-checkouts', '0 3 * * *',
  $$DELETE FROM abandoned_checkouts
    WHERE created_at < now() - INTERVAL '60 days'$$);

-- 14d. Outbox cleanup: delete completed events > 7 days
SELECT cron.schedule('outbox-cleanup', '0 4 * * *',
  $$DELETE FROM outbox_events
    WHERE status = 'completed' AND created_at < now() - INTERVAL '7 days'$$);

-- 14e. Monthly REINDEX (first Sunday of each month at 3 AM)
SELECT cron.schedule('monthly-reindex', '0 3 1 * *',
  $$REINDEX INDEX CONCURRENTLY idx_orders_admin_active;
    REINDEX INDEX CONCURRENTLY idx_products_active;
    REINDEX INDEX CONCURRENTLY idx_products_sku_active$$);

-- ═══════════════════════════════════════════════════════════════════
-- PostgreSQL.conf Recommendations (apply via docker/helm)
-- ═══════════════════════════════════════════════════════════════════

-- # WAL Tuning (NVMe SSD)
-- wal_buffers = 64MB
-- checkpoint_timeout = 15min
-- checkpoint_completion_target = 0.9
-- max_wal_size = 4GB
-- min_wal_size = 1GB

-- # Memory
-- shared_buffers = 25% of RAM
-- effective_cache_size = 75% of RAM
-- work_mem = 64MB
-- maintenance_work_mem = 512MB

-- # Parallelism
-- max_parallel_workers_per_gather = 4
-- max_parallel_workers = 8

-- # Connections (with PgBouncer)
-- max_connections = 200

-- ═══════════════════════════════════════════════════════════════════
-- END OF PRODUCTION MIGRATION
-- ═══════════════════════════════════════════════════════════════════
