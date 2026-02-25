-- 🛡️ Apex v2 — Zero-Trust Security Triggers
-- Scope: updated_at automation, refund overflow prevention, and financial guards.

-- 1. UPDATED_AT AUTOMATION (Directive #3)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CLOCK_TIMESTAMP();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. REFUND OVERFLOW GUARD (Directive #6)
CREATE OR REPLACE FUNCTION check_refund_overflow()
RETURNS TRIGGER AS $$
DECLARE
    total_refunded BIGINT;
    order_total BIGINT;
BEGIN
    SELECT SUM(amount) INTO total_refunded FROM storefront.refunds WHERE order_id = NEW.order_id;
    SELECT total INTO order_total FROM storefront.orders WHERE id = NEW.order_id;

    IF (COALESCE(total_refunded, 0) + NEW.amount) > order_total THEN
        RAISE EXCEPTION 'Refund Overflow: Total refunded amount exceeds order total.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refund_overflow_guard
BEFORE INSERT ON storefront.refunds
FOR EACH ROW EXECUTE FUNCTION check_refund_overflow();

-- 3. AUDIT IMMUTABILITY (Mandate #4)
-- Prevent anyone, including rogue internal admins, from deleting or altering audit trails.
REVOKE UPDATE, DELETE ON governance.audit_logs FROM ALL;
-- Note: Restore only for specific maintenance migrations if strictly required.
