-- 🛡️ V6 FATAL AUDIT - ANTI-FRAUD ENGINE (MANDATES #5, #7, #9)

-- MANDATE #5: Audit Log Tampering 
-- Prevent rogue admins from wiping tracks
REVOKE UPDATE, DELETE ON governance.audit_logs FROM ALL;
REVOKE UPDATE, DELETE ON public.audit_logs FROM ALL;

-- MANDATE #7: Refund Overflow Exploit
-- Hard exception if API attempts to refund more than the order subtotal
CREATE OR REPLACE FUNCTION check_refund_overflow()
RETURNS TRIGGER AS $$
DECLARE
    total_refunded BIGINT;
    order_total BIGINT;
BEGIN
    -- Auditor Point #13: Strict FOR SHARE lock to prevent races
    SELECT (total->>'amount')::BIGINT INTO order_total 
    FROM storefront.orders 
    WHERE id = NEW.order_id FOR SHARE;

    SELECT COALESCE(SUM((amount->>'amount')::BIGINT), 0) INTO total_refunded 
    FROM storefront.refunds 
    WHERE order_id = NEW.order_id;

    IF (total_refunded + (NEW.amount->>'amount')::BIGINT) > order_total THEN
        RAISE EXCEPTION 'Refund Overflow: Total refunded amount exceeds order total.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refund_overflow ON storefront.refunds;
CREATE TRIGGER trg_refund_overflow
BEFORE INSERT ON storefront.refunds
FOR EACH ROW EXECUTE FUNCTION check_refund_overflow();


-- MANDATE #9: Affiliate Self-Referral Fraud
-- Prevent customers from using their own affiliate codes via reference_order_id
CREATE OR REPLACE FUNCTION prevent_affiliate_self_referral()
RETURNS TRIGGER AS $$
DECLARE
    order_c_id UUID;
    affiliate_email TEXT;
    customer_email TEXT;
BEGIN
    -- Only run if referencing an order
    IF NEW.reference_order_id IS NOT NULL THEN
        -- Get the email of the customer placing the order
        SELECT c.email INTO customer_email 
        FROM storefront.orders o 
        JOIN storefront.customers c ON o.customer_id = c.id 
        WHERE o.id = NEW.reference_order_id::uuid;
        
        -- Get the email of the affiliate partner
        SELECT email INTO affiliate_email 
        FROM storefront.affiliate_partners 
        WHERE id = NEW.partner_id;

        IF customer_email = affiliate_email THEN
             RAISE EXCEPTION 'Affiliate Self-Referral Fraud: Customer cannot use their own code.' USING ERRCODE = 'P0001';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_self_referral ON storefront.affiliate_transactions;
CREATE TRIGGER trg_prevent_self_referral
BEFORE INSERT ON storefront.affiliate_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_affiliate_self_referral();
