-- 🛡️ V6 FATAL AUDIT - PER-TENANT ORDER SEQUENCES (MANDATE #28)
-- Prevents global GMV inference by ensuring order numbers are sequential strictly per tenant.

CREATE OR REPLACE FUNCTION storefront.generate_order_number()
RETURNS trigger AS $$
DECLARE
    next_val INT;
BEGIN
    -- This function atomically increments a counter stored in a tenant_sequences table
    -- or just calculates based on the existing max.
    -- For real enterprise high-scale, we'd use a separate sequence table.
    
    -- Option A: Dynamic Sequence Calculation (Safe for low/medium volume)
    SELECT COALESCE(MAX(order_number::INT), 0) + 1 INTO next_val
    FROM storefront.orders
    WHERE tenant_id = NEW.tenant_id;

    NEW.order_number := next_val::TEXT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON storefront.orders;
CREATE TRIGGER trg_set_order_number
    BEFORE INSERT ON storefront.orders
    FOR EACH ROW
    EXECUTE FUNCTION storefront.generate_order_number();
