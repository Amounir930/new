-- 🚨 Audit 999 Integrity Hardening: 0057_atomic_sequences.sql

-- 1. Centralized Sequences Table (Audit Point #12)
-- Used for per-tenant order numbering to avoid MAX() race conditions.
CREATE TABLE IF NOT EXISTS storefront.tenant_sequences (
    tenant_id UUID NOT NULL,
    sequence_key TEXT NOT NULL,
    current_value BIGINT DEFAULT 0,
    PRIMARY KEY (tenant_id, sequence_key)
);

CREATE OR REPLACE FUNCTION storefront.get_next_sequence_value(
    p_tenant_id UUID,
    p_sequence_key TEXT
)
RETURNS BIGINT AS $$
DECLARE
    next_val BIGINT;
BEGIN
    INSERT INTO storefront.tenant_sequences (tenant_id, sequence_key, current_value)
    VALUES (p_tenant_id, p_sequence_key, 1)
    ON CONFLICT (tenant_id, sequence_key) 
    DO UPDATE SET current_value = storefront.tenant_sequences.current_value + 1
    RETURNING current_value INTO next_val;
    
    RETURN next_val;
END;
$$ LANGUAGE plpgsql;

-- 2. Update Order Trigger to use the Atomic Sequence
CREATE OR REPLACE FUNCTION storefront.generate_tenant_order_number_v2()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := storefront.get_next_sequence_value(NEW.tenant_id, 'orders')::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to orders table
DROP TRIGGER IF EXISTS trg_order_number ON storefront.orders;
CREATE TRIGGER trg_order_number
BEFORE INSERT ON storefront.orders
FOR EACH ROW EXECUTE FUNCTION storefront.generate_tenant_order_number_v2();
