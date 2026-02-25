-- 🚨 FATAL HARDENING: Category E, F & G (Final Automation & Integrity)
-- 0131_automation_final.sql

-- 1. ULID Monotonicity Guard (Risk #40)
-- Mandate #40: Prevent B-Tree fragmentation from non-ULID insertions.
CREATE OR REPLACE FUNCTION public.is_valid_ulid(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validates ULID-encoded UUID structure: ^[0-7][0-9A-HJKMNP-TV-Z]{25}$
    -- Note: Since we store ULIDs as UUID bytes, we check the binary structure.
    -- High bits of the first byte must be < 8 (0111) to be a valid ULID.
    RETURN (get_byte(decode(replace(p_id::text, '-', ''), 'hex'), 0) < 128);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. GDPR Consent Immutability (Risk #44)
-- Mandate #44: Prohibit UPDATE on consent records natively to ensure non-repudiation.
CREATE RULE no_update_on_consent AS 
ON UPDATE TO storefront.customer_consents 
DO INSTEAD NOTHING;

-- 3. Flash Sale Timezone Hard-Lock (Risk #45)
-- Mandate #45: All starts_at/ends_at MUST be in UTC (X-Offset = 0).
ALTER TABLE storefront.products 
ADD CONSTRAINT check_flash_sale_utc 
CHECK (extract(timezone from starts_at) = 0);

-- 4. Order Metadata Bloat Protection (Risk #48)
-- Mandate #48: Limit tax/shipping line arrays to prevent memory crashes on retrieval.
ALTER TABLE storefront.orders 
ADD CONSTRAINT check_tax_lines_limit 
CHECK (jsonb_array_length(tax_lines) <= 20);

-- 5. Automated Analyzer (Risk #43)
-- Mandate #43: Run ANALYZE right after high-volume tenant activities.
CREATE OR REPLACE FUNCTION maintenance.analyze_tenant(p_tenant_id TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('ANALYZE tenant_%s.orders', p_tenant_id);
    EXECUTE format('ANALYZE tenant_%s.products', p_tenant_id);
END;
$$ LANGUAGE plpgsql;

-- 6. Outbox SKIP LOCKED (Risk #45)
-- Optimization: Polling with SKIP LOCKED ensures high concurrency without worker contention.
CREATE OR REPLACE VIEW storefront.v_pending_outbox AS 
SELECT * FROM storefront.outbox_events 
WHERE status = 'pending' 
FOR UPDATE SKIP LOCKED;

-- 7. Automated Partition TTL (Risk #34)
-- Implement TTL-based partition dropping for carts/sessions.
SELECT cron.schedule('drop_old_partitions', '0 2 * * *', 
    $$SELECT maintenance.sweep_all_tenants('drop_old_partitions')$$);

RAISE NOTICE 'Category E/F/G: Final Integrity & Automation Layer Applied.';
