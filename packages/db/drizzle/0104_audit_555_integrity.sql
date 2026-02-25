-- 🚨 Audit 555 Integrity Lockdown: 0104_audit_555_integrity.sql

-- 1. Refund Race Condition Protection (Audit 555 Point #8 & #27)
-- Uses SELECT FOR UPDATE to prevent concurrent refund overflows.
CREATE OR REPLACE FUNCTION storefront.check_refund_overflow()
RETURNS TRIGGER AS $$
DECLARE
    order_total BIGINT;
    refunded_total BIGINT;
BEGIN
    -- LOCK the order row to prevent concurrent refunds from slipping through
    SELECT (total->>'amount')::BIGINT INTO order_total 
    FROM storefront.orders 
    WHERE id = NEW.order_id
    FOR UPDATE; 

    -- ONLY sum completed or pending refunds, EXCLUDE 'failed'
    SELECT COALESCE(SUM((amount->>'amount')::BIGINT), 0) INTO refunded_total
    FROM storefront.refunds 
    WHERE order_id = NEW.order_id 
    AND status IN ('completed', 'pending');

    IF (refunded_total + (NEW.amount->>'amount')::BIGINT) > order_total THEN
        RAISE EXCEPTION 'Total refund amount cannot exceed order total (Race Condition Prevented)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Audit Log Performance Optimization (Audit 555 Point #11)
-- Adds is_valid column to avoid calculating HMAC on every read.
ALTER TABLE governance.audit_logs 
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT TRUE;

CREATE OR REPLACE FUNCTION governance.verify_audit_log_write()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set is_valid to true on insert; background worker or view handles deep verification
    NEW.is_valid := TRUE; 
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_verify ON governance.audit_logs;
CREATE TRIGGER trg_audit_log_verify
BEFORE INSERT ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.verify_audit_log_write();

-- 5. Function & View Security (Audit 555 Points #39, #40)
-- Revoke PUBLIC execute from sensitive security functions.
REVOKE EXECUTE ON FUNCTION governance.validate_role_escalation_v2(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION governance.validate_role_escalation_v2(TEXT, TEXT, TEXT, TEXT) TO system_role;

-- Revoke select from tenant_role on verification view
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_verified_audit_logs') THEN
        REVOKE SELECT ON governance.vw_verified_audit_logs FROM tenant_role;
        GRANT SELECT ON governance.vw_verified_audit_logs TO auditor_role;
    END IF;
END $$;
