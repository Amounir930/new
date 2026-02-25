-- 🚨 FATAL LOCKDOWN: Phase II — Final Cleanup & Risk Mitigation
-- 0137_phase_ii_cleanup.sql

-- 1. Extension Pinning (Risk #26)
-- Mandate: Version vector to prevent breaking changes.
CREATE EXTENSION IF NOT EXISTS vector WITH VERSION '0.5.0';

-- 2. OCC Not-Null Enforcement (Risk #28)
-- Mandate: Prevent NULL versions in optimistic concurrency control.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name 
        FROM information_schema.columns 
        WHERE column_name = 'version' 
        AND table_schema IN ('storefront', 'governance')
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN version SET NOT NULL', r.table_schema, r.table_name);
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN version SET DEFAULT 1', r.table_schema, r.table_name);
    END LOOP;
END $$;

-- 3. Ledger Read Verification View (Risk #22)
-- Mandate: Recalculate checksums on SELECT to detect tampering.
CREATE OR REPLACE VIEW storefront.vw_verified_wallets AS
SELECT 
    *,
    public.calculate_wallet_checksum_v2(id, (wallet_balance).amount, (wallet_balance).currency, secret_salt) as expected_checksum,
    CASE 
        WHEN wallet_checksum = public.calculate_wallet_checksum_v2(id, (wallet_balance).amount, (wallet_balance).currency, secret_salt) THEN TRUE 
        ELSE FALSE 
    END as is_integrity_valid
FROM storefront.customers;

-- 4. Ops Notification for Outbox (Risk #33)
-- Mandate: Notify ops channel when events fail permanently.
CREATE OR REPLACE FUNCTION storefront.trg_outbox_notify_failure()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        PERFORM pg_notify('ops_alert', jsonb_build_object(
            'event', 'outbox_critical_failure',
            'id', NEW.id,
            'type', NEW.event_type,
            'tenant_id', NEW.tenant_id
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_outbox_notify ON storefront.outbox;
CREATE TRIGGER trg_outbox_notify
AFTER UPDATE ON storefront.outbox
FOR EACH ROW EXECUTE FUNCTION storefront.trg_outbox_notify_failure();

-- 5. Materialized View Concurrent Refresh (Risk #30)
-- Mandate: Ensure refresh doesn't lock readers.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_tenant_billing') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mv_billing_tenant') THEN
            CREATE UNIQUE INDEX idx_mv_billing_tenant ON storefront.mv_tenant_billing (tenant_id);
        END IF;
        -- Future refreshes should be: REFRESH MATERIALIZED VIEW CONCURRENTLY storefront.mv_tenant_billing;
    END IF;
END $$;

RAISE NOTICE 'Phase II: Final Cleanup & Risk Mitigation Applied.';
