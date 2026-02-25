-- 🛡️ Audit 444 JSON & Automation Hardening: 0107_audit_444_json_auto.sql
-- Goal: Harden JSONB data handling and implement cron job visibility.

-- 1. JSONB Size Constraints (Issue 1: DoS Protection)
-- Limit all sensitive JSONB columns to 1MB to prevent memory exhaustion / storage DoS.

-- 1. Global JSONB Size Constraints (Issue 1: DoS Protection)
-- Apply checks to ALL jsonb columns in core schemas.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE data_type = 'jsonb' 
        AND table_schema IN ('governance', 'storefront')
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT chk_%I_size CHECK (pg_column_size(%I) < 1048576)', 
            r.table_schema, r.table_name, r.column_name, r.column_name);
    END LOOP;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Cron Visibility (Issue 8: Silent Fail Protection)
-- Create logging table for pg_cron executions.

CREATE TABLE IF NOT EXISTS governance.cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED'
    affected_rows INTEGER,
    error_message TEXT,
    execution_context JSONB
);

-- 3. Cron Wrapper Function
-- Ensures all jobs log their status and handle errors gracefully.

CREATE OR REPLACE FUNCTION governance.run_cron_job(p_job_name TEXT, p_query TEXT)
RETURNS VOID AS $$
DECLARE
    v_log_id UUID;
    v_start_time TIMESTAMPTZ := NOW();
    v_affected_rows INTEGER;
BEGIN
    INSERT INTO governance.cron_job_logs (job_name, start_time, status)
    VALUES (p_job_name, v_start_time, 'RUNNING')
    RETURNING id INTO v_log_id;

    BEGIN
        EXECUTE p_query;
        GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

        UPDATE governance.cron_job_logs
        SET end_time = NOW(),
            status = 'COMPLETED',
            affected_rows = v_affected_rows
        WHERE id = v_log_id;
    EXCEPTION WHEN OTHERS THEN
        UPDATE governance.cron_job_logs
        SET end_time = NOW(),
            status = 'FAILED',
            error_message = SQLERRM
        WHERE id = v_log_id;
        RAISE NOTICE 'Cron Job % failed: %', p_job_name, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
