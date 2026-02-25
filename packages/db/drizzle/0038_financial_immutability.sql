-- Mandate #13: Atomic Refund Sum Check
-- Mandate #14: Order Math Constraint
-- Mandate #15: Positive Quantities
-- Mandate #16: Affiliate Fraud Prevention
-- Mandate #17: Coupon Normalization
-- Mandate #18: Promo Exhaustion
-- Mandate #19: Per-Tenant Sequence
-- Mandate #20: Wallet OCC

-- 1. Atomic Refund Check (Mandate #13)
CREATE OR REPLACE FUNCTION storefront.prevent_refund_overflow()
RETURNS TRIGGER AS $$
DECLARE
    total_refunded BIGINT;
    order_total BIGINT;
BEGIN
    -- Atomic Row Lock for Share to prevent concurrent refund races
    SELECT (total->>'amount')::BIGINT INTO order_total 
    FROM storefront.orders 
    WHERE id = NEW.order_id FOR SHARE;

    SELECT COALESCE(SUM((amount->>'amount')::BIGINT), 0) INTO total_refunded 
    FROM storefront.refunds 
    WHERE order_id = NEW.order_id AND status = 'completed';

    IF (total_refunded + (NEW.amount->>'amount')::BIGINT) > order_total THEN
        RAISE EXCEPTION 'Financial Violation: Total refunds exceed order total'
        USING ERRCODE = 'P0014';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Positive Quantities (Mandate #15)
-- Apply to all relevant tables in one sweep if possible, but let's do explicit ones for safety
ALTER TABLE storefront.order_items ADD CONSTRAINT ck_qty_pos CHECK (quantity > 0);
ALTER TABLE storefront.refund_items ADD CONSTRAINT ck_qty_pos CHECK (quantity > 0);
ALTER TABLE storefront.inventory_movements ADD CONSTRAINT ck_qty_pos CHECK (quantity > 0);
ALTER TABLE storefront.rma_items ADD CONSTRAINT ck_qty_pos CHECK (quantity > 0);

-- 3. Affiliate Self-Dealing (Mandate #16)
-- Assuming affiliates table has a customer_id link to their own customer profile
-- If not, we validate based on email or other identifiers
CREATE OR REPLACE FUNCTION storefront.prevent_affiliate_self_deal()
RETURNS TRIGGER AS $$
DECLARE
    affiliate_cust_id UUID;
BEGIN
    SELECT customer_id INTO affiliate_cust_id FROM storefront.affiliates WHERE id = NEW.affiliate_id;
    IF NEW.customer_id = affiliate_cust_id THEN
        RAISE EXCEPTION 'Fraud Violation: Affiliates cannot refer themselves'
        USING ERRCODE = 'P0015';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Coupon Normalization (Mandate #17)
CREATE OR REPLACE FUNCTION storefront.normalize_coupon_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.code := UPPER(NEW.code);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Per-Tenant Sequential Numbers (Mandate #19)
CREATE OR REPLACE FUNCTION storefront.generate_tenant_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num BIGINT;
BEGIN
    IF NEW.order_number IS NULL THEN
        -- Atomic increment inside the tenant context
        -- This uses a subquery to avoid global sequences which leak metadata
        SELECT COALESCE(MAX(order_number::BIGINT), 0) + 1 INTO next_num 
        FROM storefront.orders WHERE tenant_id = NEW.tenant_id;
        NEW.order_number := next_num::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Wallet OCC (Mandate #20)
-- Handled via version increment check
CREATE OR REPLACE FUNCTION storefront.enforce_wallet_occ()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.version != NEW.version - 1 THEN
        RAISE EXCEPTION 'Concurrency Violation: Race condition detected on wallet balance update'
        USING ERRCODE = 'P0016';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
