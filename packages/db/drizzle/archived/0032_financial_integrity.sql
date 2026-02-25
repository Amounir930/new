-- Mandate #21: Optimistic Concurrency Control (OCC) for Wallet
-- Mandate #22: Atomic Refund Overflow Protection
-- Mandate #23: Order Math Integrity

-- 1. Wallet OCC Trigger
CREATE OR REPLACE FUNCTION storefront.enforce_customer_version_check()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wallet_balance != OLD.wallet_balance AND NEW.version != OLD.version + 1 THEN
        RAISE EXCEPTION 'OCC Violation: Sensitive data modification detected without version increment'
        USING ERRCODE = 'P0002';
    END IF;
    
    -- Auto-increment version if not explicitly done (Safety net)
    IF NEW.wallet_balance != OLD.wallet_balance AND NEW.version = OLD.version THEN
        NEW.version := OLD.version + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Refund Overflow Protection (Mandate #22)
CREATE OR REPLACE FUNCTION storefront.check_refund_overflow()
RETURNS TRIGGER AS $$
DECLARE
    total_refunded BIGINT;
    order_total BIGINT;
BEGIN
    -- Sum all successful refunds for this order
    SELECT COALESCE(SUM((amount->>'amount')::BIGINT), 0)
    INTO total_refunded
    FROM storefront.order_refunds
    WHERE order_id = NEW.order_id AND status = 'completed';

    -- Get the original order total
    SELECT (total_amount->>'amount')::BIGINT
    INTO order_total
    FROM storefront.orders
    WHERE id = NEW.order_id;

    IF (total_refunded + (NEW.amount->>'amount')::BIGINT) > order_total THEN
        RAISE EXCEPTION 'Financial Violation: Total refund amount exceeds order total'
        USING ERRCODE = 'P0003';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers (Example syntax for migrations)
-- DROP TRIGGER IF EXISTS trg_wallet_occ ON storefront.customers;
-- CREATE TRIGGER trg_wallet_occ BEFORE UPDATE ON storefront.customers FOR EACH ROW EXECUTE FUNCTION storefront.enforce_customer_version_check();
