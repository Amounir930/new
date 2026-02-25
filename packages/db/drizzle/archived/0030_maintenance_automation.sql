-- Mandate #30: pg_partman Automation
-- Implements automated partition management for high-volume logs and leads.
-- This prevents performance degradation as the database grows.

-- Note: This requires the pg_partman extension to be installed in the PostgreSQL instance.

-- 1. Enable pg_partman (if not already enabled)
CREATE SCHEMA IF NOT EXISTS partman;
-- CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;

-- 2. Partition governance.audit_logs by created_at (Monthly)
-- Assuming the table is already created as a partitioned table in Drizzle.
-- If not, it needs to be created with PARTITION BY RANGE (created_at).

-- SELECT partman.create_parent(
--     p_parent_table := 'governance.audit_logs',
--     p_control := 'created_at',
--     p_type := 'native',
--     p_interval := 'monthly',
--     p_premake := 3
-- );

-- 3. Partition storefront.analytics by created_at (Daily)
-- SELECT partman.create_parent(
--     p_parent_table := 'storefront.analytics',
--     p_control := 'created_at',
--     p_type := 'native',
--     p_interval := 'daily',
--     p_premake := 7
-- );

-- 4. Configure Retention Policy (6 months for audit logs, 30 days for analytics)
-- UPDATE partman.part_config 
-- SET retention = '6 months', retention_keep_table = false 
-- WHERE parent_table = 'governance.audit_logs';

-- UPDATE partman.part_config 
-- SET retention = '30 days', retention_keep_table = false 
-- WHERE parent_table = 'storefront.analytics';

-- Mandate #30: Maintenance automation SQL placeholder
-- Since pg_partman depends on external extensions, we provide the setup script here.
-- The actual execution happens during DB provisioning.
