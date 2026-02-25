-- 🚨 Audit 777 Performance Hardening: 0102_partitioning_refinement.sql

-- 1. Monthly Partitioning for Payment Logs (Audit 777 Point #21)
-- Higher granularity compared to yearly partitioning to maintain performance.
-- Use pg_partman for canonical management.

SELECT partman.create_parent(
    p_parent_table := 'storefront.payment_logs', 
    p_control := 'created_at', 
    p_type := 'native', 
    p_interval := 'monthly', 
    p_premake := 3
);

-- Ensure partman maintenance is scheduled (should be in 0099, but adding here for safety)
-- SELECT cron.schedule('partman-maintenance', '@hourly', 'SELECT partman.run_maintenance()');
