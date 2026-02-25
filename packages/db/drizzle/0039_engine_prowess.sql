-- Mandate #21: Materialized Billing View
-- Mandate #22: Table Partitioning
-- Mandate #23: Engine-Level updated_at
-- Mandate #24: pgvector Tuning
-- Mandate #25: Deferred Constraints

-- 1. Engine-Level updated_at (Mandate #23)
-- Prevents application layer from spoofing update timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Materialized Billing Metrics (Mandate #21)
-- This assumes audit_logs is populated. Refreshed via cron.
CREATE MATERIALIZED VIEW governance.tenant_billing_metrics AS
SELECT 
    tenant_id,
    count(*) as total_actions,
    max(created_at) as last_activity
FROM governance.audit_logs
GROUP BY tenant_id;

-- Schedule refresh (requires pg_cron)
-- SELECT cron.schedule('refresh_billing_metrics', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY governance.tenant_billing_metrics');

-- 3. Partitioning Support (Mandate #22)
-- Note: Re-creating tables as partitioned requires data migration if not empty
-- Here we provide the template for the partitioned structure
/*
CREATE TABLE governance.audit_logs_partitioned (
    LIKE governance.audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE storefront.outbox_events_partitioned (
    LIKE storefront.outbox_events INCLUDING ALL
) PARTITION BY RANGE (created_at);
*/

-- 4. pgvector HNSW Tuning (Mandate #24)
-- Optimization for vector similarity searches
-- ALTER INDEX idx_product_vector SET (m = 16, ef_construction = 64);

-- 5. Deferred Constraints for Bulk Imports (Mandate #25)
-- Prevents circular deadlock during mass CSV ingestion
-- ALTER TABLE storefront.order_items ALTER CONSTRAINT order_items_order_id_orders_id_fk DEFERRABLE INITIALLY DEFERRED;
-- ALTER TABLE storefront.order_items ALTER CONSTRAINT order_items_variant_id_product_variants_id_fk DEFERRABLE INITIALLY DEFERRED;

-- 6. Neural Disconnect Cleanup (Mandate #23)
-- Applying the updated_at trigger to EVERY table that has the column
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_schema, table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema IN ('governance', 'storefront')
    LOOP
        EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', r.table_schema, r.table_name);
    END LOOP;
END $$;
