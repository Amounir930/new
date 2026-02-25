-- 🛡️ Audit 444 Automation Hardening: 0110_audit_444_automation_triggers.sql
-- Goal: Zero-Manual Intervention for Cron & Financial Transactions.

-- 1. Self-Healing Cron Alerting (Gap #1)
-- Redefine run_cron_job to include pg_notify on failure.
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
        
        -- Gap #1: Self-Healing Alerting via pg_notify
        PERFORM pg_notify(
            'cron_failure', 
            json_build_object(
                'job', p_job_name, 
                'log_id', v_log_id,
                'error', SQLERRM,
                'timestamp', NOW()
            )::text
        );
        
        RAISE NOTICE 'Cron Job % failed: %', p_job_name, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Unified Wallet OCC Error Code (Gap #3 Prep)
-- Ensures all OCC violations return P0001 for automated app-layer retry.
CREATE OR REPLACE FUNCTION storefront.enforce_wallet_occ()
RETURNS TRIGGER AS $$
BEGIN
    -- Only enforce OCC if the balance is actually changing
    IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
        -- If NEW.version isn't exactly OLD + 1, it's a Concurrent Modification
        IF NEW.version IS NOT DISTINCT FROM OLD.version THEN
            RAISE EXCEPTION 'OCC Violation: Wallet balance update requires version increment.'
            USING ERRCODE = 'P0001';
        END IF;

        IF NEW.version != OLD.version + 1 THEN
            RAISE EXCEPTION 'OCC Violation: Stale wallet version. Expected %, got %', OLD.version + 1, NEW.version
            USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
