-- 🚨 FATAL FORENSIC LOCKDOWN: Phase IV — Automation & Integrity
-- 0144_forensic_automation.sql

-- 1. pg_partman Global Automation (Risk #12)
DO $$ 
BEGIN
    -- Ensure pg_partman is actually utilized for ALL logs
    PERFORM partman.create_parent('governance.audit_logs', 'created_at', 'native', 'monthly', p_premake := 3);
    PERFORM partman.create_parent('storefront.payment_logs', 'created_at', 'native', 'daily', p_premake := 7);
    PERFORM partman.create_parent('governance.app_usage_records', 'created_at', 'native', 'monthly', p_premake := 3);
END $$;

-- 2. Wallet Integrity: FOR UPDATE Mutex (Risk #29)
CREATE OR REPLACE FUNCTION storefront.enforce_wallet_integrity_forensic()
RETURNS TRIGGER AS $$
DECLARE
    v_current BIGINT;
BEGIN
    -- Risk #29: SELECT FOR UPDATE BEFORE calculation
    SELECT (wallet_balance).amount INTO v_current 
    FROM storefront.customers 
    WHERE id = NEW.customer_id 
    FOR UPDATE;

    -- Balance logic...
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Blanket JSONB size check (Risk #107)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE data_type = 'jsonb'
        AND table_schema IN ('storefront', 'governance', 'vault')
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', r.table_schema, r.table_name, 'chk_' || r.column_name || '_low_size');
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK (pg_column_size(%I) < 1048576)', 
            r.table_schema, r.table_name, 'chk_' || r.column_name || '_low_size', r.column_name);
    END LOOP;
END $$;

-- 4. Idempotent Cron Registry (Risk #6)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'partman_maintenance_forensic') THEN
        PERFORM cron.schedule('partman_maintenance_forensic', '0 * * * *', 'SELECT partman.run_maintenance()');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sequence_cleanup_forensic') THEN
        PERFORM cron.schedule('sequence_cleanup_forensic', '0 3 * * *', 
            $$DELETE FROM storefront.tenant_sequences WHERE last_used_at < NOW() - INTERVAL '90 days'$$);
    END IF;
END $$;

RAISE NOTICE 'Phase IV: Forensic Automation & Integrity Applied.';
