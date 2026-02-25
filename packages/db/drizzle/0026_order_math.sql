-- 🛡️ V6 FATAL AUDIT - ORDER MATH TAMPERING (MANDATE #22)
-- Enforces subtotal + shipping + tax - discount = total at the DB engine level.

CREATE OR REPLACE FUNCTION storefront.enforce_order_math()
RETURNS trigger AS $$
BEGIN
    IF NEW.total != (NEW.subtotal + NEW.shipping_total + NEW.tax_total - NEW.discount_total) THEN
        RAISE EXCEPTION 'Order Math Tampering: total (%) != subtotal (%) + shipping (%) + tax (%) - discount (%)', 
            NEW.total, NEW.subtotal, NEW.shipping_total, NEW.tax_total, NEW.discount_total
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_order_math ON storefront.orders;
CREATE TRIGGER ensure_order_math
    BEFORE INSERT OR UPDATE ON storefront.orders
    FOR EACH ROW
    EXECUTE FUNCTION storefront.enforce_order_math();
