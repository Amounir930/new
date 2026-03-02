#!/bin/bash
export PGPASSWORD='ApexV2DBPassSecure2026GrowthScale!QazXswEdCv'
echo "Checking schemas..."
docker exec apex-postgres psql -U apex -d apex_v2 -c '\dn'

echo "Fixing audit_logs partitions..."
docker exec apex-postgres psql -U apex -d apex_v2 << 'EOF'
-- Ensure pg_partman maintenance runs
SELECT public.run_maintenance();

-- If still no partitions, create current and next (just in case)
DO $$ 
BEGIN 
    PERFORM public.create_parent(
        p_parent_table := 'governance.audit_logs',
        p_control := 'created_at',
        p_type := 'native',
        p_interval := 'daily',
        p_premake := 3
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_partman parent already exists or error: %', SQLERRM;
END $$;

-- Manual sanity check: create the partition for today if it doesn't exist
DO $$
DECLARE
    partition_name text;
BEGIN
    partition_name := 'governance.audit_logs_p' || to_char(now(), 'YYYY_MM_DD');
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'governance' AND c.relname = partition_name) THEN
        EXECUTE format('CREATE TABLE %I PARTITION OF governance.audit_logs FOR VALUES FROM (%L) TO (%L)', 
            partition_name, 
            date_trunc('day', now()), 
            date_trunc('day', now() + interval '1 day')
        );
    END IF;
END $$;
EOF

echo "Verification complete."
