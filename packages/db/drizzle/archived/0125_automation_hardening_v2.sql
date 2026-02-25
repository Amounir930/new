-- 🚨 FATAL HARDENING: Category E (Zero-Manual Automation)
-- 0125_automation_hardening_v2.sql

-- 1. Create maintenance schema for global tasks
CREATE SCHEMA IF NOT EXISTS maintenance;

-- 2. Global Tenant Sweep Function (Risk #29)
-- Iterates through all tenants to run maintenance tasks.
CREATE OR REPLACE FUNCTION maintenance.sweep_all_tenants(p_task TEXT)
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, subdomain FROM governance.tenants WHERE status = 'active' LOOP
        -- Execute task for each tenant (e.g., clear abandoned carts)
        IF p_task = 'clear_abandoned_carts' THEN
            EXECUTE format('DELETE FROM tenant_%s.abandoned_checkouts WHERE created_at < NOW() - INTERVAL ''60 days''', r.id);
        ELSIF p_task = 'clear_expired_sessions' THEN
            EXECUTE format('DELETE FROM tenant_%s.staff_sessions WHERE expires_at < NOW()', r.id);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dynamic Partition Creation Trigger (Risk #30)
-- Forces partition creation BEFORE insertion failure.
CREATE OR REPLACE FUNCTION maintenance.ensure_outbox_partition()
RETURNS TRIGGER AS $$
DECLARE
    v_partition_name TEXT;
    v_start_date TEXT;
    v_end_date TEXT;
BEGIN
    v_partition_name := 'outbox_events_' || to_char(NEW.created_at, 'YYYY_MM');
    v_start_date := to_char(date_trunc('month', NEW.created_at), 'YYYY-MM-DD');
    v_end_date := to_char(date_trunc('month', NEW.created_at) + INTERVAL '1 month', 'YYYY-MM-DD');

    BEGIN
        EXECUTE format('CREATE TABLE IF NOT EXISTS storefront.%I PARTITION OF storefront.outbox_events FOR VALUES FROM (%L) TO (%L)', 
            v_partition_name, v_start_date, v_end_date);
    EXCEPTION WHEN duplicate_table THEN
        -- Ignore
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Outbox Dead-Letter Handling (Risk #31)
-- Auto-fail events after 5 retries at the DB level.
CREATE OR REPLACE FUNCTION storefront.trg_outbox_dead_letter()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.metadata->>'retry_count')::INTEGER >= 5 THEN
        NEW.status := 'failed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_outbox_retry_limit ON storefront.outbox_events;
CREATE TRIGGER trg_outbox_retry_limit
BEFORE UPDATE OF metadata ON storefront.outbox_events
FOR EACH ROW EXECUTE FUNCTION storefront.trg_outbox_dead_letter();

-- 5. Wishlist Hard-Limit (Risk #32)
-- Mandate #32: 500 items per customer max.
CREATE OR REPLACE FUNCTION storefront.enforce_wishlist_limit()
RETURNS TRIGGER AS $$
DECLARE v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count FROM storefront.wishlists WHERE customer_id = NEW.customer_id;
    IF v_count >= 500 THEN
        RAISE EXCEPTION 'Quota Violation: Wishlist limit reached (500 items)' USING ERRCODE = 'P0005';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. pg_stat_statements Auto-Reset (Risk #33)
SELECT cron.schedule('reset_pg_stats', '0 0 * * 0', 'SELECT pg_stat_statements_reset()');

RAISE NOTICE 'Category E: Zero-Manual Automation Layer Applied.';
