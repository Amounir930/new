-- ═══════════════════════════════════════════════════════════════
-- PRODUCTION EMERGENCY FIX SCRIPT
-- Incident: S4 Audit Persistence & Tenant Discovery Failure
-- Date: 2026-04-08
-- 
-- USAGE: psql -h <host> -U <user> -d <database> -f emergency_fix.sql
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────
-- STEP 1: Verify/Create System Tenant
-- ───────────────────────────────────────────────────────────────
DO $$
BEGIN
    -- Check if system tenant exists
    IF NOT EXISTS (
        SELECT 1 FROM governance.tenants 
        WHERE id = '00000000-0000-0000-0000-000000000000'
    ) THEN
        RAISE NOTICE 'System tenant missing. Creating...';
        
        INSERT INTO governance.tenants (
            id, 
            subdomain, 
            name, 
            status, 
            tier,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            'system',
            'System Tenant',
            'active',
            'internal',
            NOW(),
            NOW()
        );
    ELSE
        RAISE NOTICE 'System tenant already exists.';
    END IF;
    
    -- Ensure system tenant is active
    UPDATE governance.tenants 
    SET status = 'active', updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000000'
      AND status != 'active';
END $$;

-- ───────────────────────────────────────────────────────────────
-- STEP 2: Verify Active Tenants
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count
    FROM governance.tenants
    WHERE status = 'active';
    
    IF active_count = 0 THEN
        RAISE WARNING 'No active tenants found! This will break cron jobs.';
        RAISE NOTICE 'Check tenant records manually and set status to active.';
    ELSE
        RAISE NOTICE 'Found % active tenants.', active_count;
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- STEP 3: Create Missing Audit Log Partitions (April 2026+)
-- ───────────────────────────────────────────────────────────────
-- Check if April 2026 partition exists, create if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid
        WHERE c.relname = 'audit_logs_2026_04'
    ) THEN
        RAISE NOTICE 'Creating audit_logs_2026_04 partition...';
        CREATE TABLE governance.audit_logs_2026_04 
            PARTITION OF governance.audit_logs
            FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
    ELSE
        RAISE NOTICE 'Partition audit_logs_2026_04 already exists.';
    END IF;
END $$;

-- Create remaining 2026 partitions if missing
DO $$
BEGIN
    -- May 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_05') THEN
        CREATE TABLE governance.audit_logs_2026_05 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
    END IF;
    
    -- June 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_06') THEN
        CREATE TABLE governance.audit_logs_2026_06 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
    END IF;
    
    -- July 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_07') THEN
        CREATE TABLE governance.audit_logs_2026_07 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
    END IF;
    
    -- August 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_08') THEN
        CREATE TABLE governance.audit_logs_2026_08 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
    END IF;
    
    -- September 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_09') THEN
        CREATE TABLE governance.audit_logs_2026_09 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
    END IF;
    
    -- October 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_10') THEN
        CREATE TABLE governance.audit_logs_2026_10 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
    END IF;
    
    -- November 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_11') THEN
        CREATE TABLE governance.audit_logs_2026_11 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
    END IF;
    
    -- December 2026
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2026_12') THEN
        CREATE TABLE governance.audit_logs_2026_12 PARTITION OF governance.audit_logs FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
    END IF;
    
    RAISE NOTICE '2026 partitions verified.';
END $$;

-- Create 2027 partitions if missing
DO $$
BEGIN
    -- January - December 2027 (only create if missing)
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_01') THEN
        CREATE TABLE governance.audit_logs_2027_01 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_02') THEN
        CREATE TABLE governance.audit_logs_2027_02 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_03') THEN
        CREATE TABLE governance.audit_logs_2027_03 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_04') THEN
        CREATE TABLE governance.audit_logs_2027_04 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_05') THEN
        CREATE TABLE governance.audit_logs_2027_05 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_06') THEN
        CREATE TABLE governance.audit_logs_2027_06 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_07') THEN
        CREATE TABLE governance.audit_logs_2027_07 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_08') THEN
        CREATE TABLE governance.audit_logs_2027_08 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_09') THEN
        CREATE TABLE governance.audit_logs_2027_09 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_10') THEN
        CREATE TABLE governance.audit_logs_2027_10 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_11') THEN
        CREATE TABLE governance.audit_logs_2027_11 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid WHERE c.relname = 'audit_logs_2027_12') THEN
        CREATE TABLE governance.audit_logs_2027_12 PARTITION OF governance.audit_logs FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');
    END IF;
    
    RAISE NOTICE '2027 partitions verified.';
END $$;

-- Create DEFAULT partition if missing (safety net)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid
        WHERE c.relname = 'audit_logs_default'
    ) THEN
        RAISE NOTICE 'Creating DEFAULT partition...';
        CREATE TABLE governance.audit_logs_default 
            PARTITION OF governance.audit_logs DEFAULT;
    ELSE
        RAISE NOTICE 'DEFAULT partition already exists.';
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- STEP 4: Verify pg_partman & Run Maintenance
-- ───────────────────────────────────────────────────────────────
DO $$
BEGIN
    -- Check if pg_partman is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_partman') THEN
        RAISE NOTICE 'pg_partman is installed. Running maintenance...';
        
        -- Run partman maintenance to auto-create future partitions
        SELECT public.run_maintenance();
        
        RAISE NOTICE 'pg_partman maintenance complete.';
    ELSE
        RAISE NOTICE 'pg_partman not installed. Manual partitions created above.';
        RAISE NOTICE 'Consider installing pg_partman for automated partition management.';
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- STEP 5: Verify Audit Logs Table Structure
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Verify tenant_id column is UUID
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'governance'
          AND table_name = 'audit_logs'
          AND column_name = 'tenant_id'
          AND data_type = 'uuid'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        RAISE EXCEPTION 'tenant_id column is not UUID type! This will cause insert failures.';
    END IF;
    
    RAISE NOTICE 'audit_logs.tenant_id is correctly typed as UUID.';
END $$;

-- ───────────────────────────────────────────────────────────────
-- STEP 6: Test Audit Log Insertion
-- ───────────────────────────────────────────────────────────────
DO $$
BEGIN
    -- Test insert with system tenant
    INSERT INTO governance.audit_logs (
        tenant_id,
        user_id,
        action,
        entity_type,
        entity_id,
        severity,
        result,
        created_at,
        actor_type,
        public_key,
        encrypted_key
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        NULL,
        'SYSTEM_HEALTH_CHECK',
        'system',
        'remediation_test',
        'INFO',
        'SUCCESS',
        NOW(),
        'system',
        'TEST',
        E'\\x00'
    );
    
    -- Clean up test row
    DELETE FROM governance.audit_logs 
    WHERE entity_id = 'remediation_test';
    
    RAISE NOTICE 'Audit log insertion test PASSED.';
END $$;

COMMIT;

-- ───────────────────────────────────────────────────────────────
-- FINAL VERIFICATION
-- ───────────────────────────────────────────────────────────────
SELECT 
    'audit_partitions' as check_type,
    COUNT(*) as partition_count
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid
WHERE c.relname LIKE 'audit_logs_2026_%'
   OR c.relname LIKE 'audit_logs_2027_%';

SELECT 
    'active_tenants' as check_type,
    COUNT(*) as tenant_count
FROM governance.tenants
WHERE status = 'active';

SELECT 
    'system_tenant' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM governance.tenants 
            WHERE id = '00000000-0000-0000-0000-000000000000'
              AND status = 'active'
        ) THEN 'EXISTS & ACTIVE'
        ELSE 'MISSING or INACTIVE'
    END as status;

-- ───────────────────────────────────────────────────────────────
-- POST-FIX NOTES
-- ───────────────────────────────────────────────────────────────
-- 1. Restart API services to clear connection pools
-- 2. Monitor logs for audit persistence errors
-- 3. Verify cron jobs run successfully
-- 4. Set GLITCHTIP_DSN environment variable for error tracking
-- 5. Run: SELECT public.run_maintenance() monthly or setup pg_partman cron
-- ───────────────────────────────────────────────────────────────
