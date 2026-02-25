-- 🚨 FATAL FORENSIC LOCKDOWN: Phase VII — Compliance Verification Routine
-- 0153_compliance_verification_routine.sql

CREATE OR REPLACE FUNCTION governance.verify_compliance()
RETURNS VOID AS $$
DECLARE
    v_missing_rls INT;
    v_cascading_fk INT;
BEGIN
    -- 1. Check for missing fail-hard RLS
    SELECT count(*) INTO v_missing_rls
    FROM pg_policies 
    WHERE (qual ~ 'current_setting' AND (qual ~ 'true' OR qual NOT ~ 'false'))
    AND schemaname IN ('storefront', 'governance');

    IF v_missing_rls > 0 THEN
        RAISE EXCEPTION 'Compliance Violation: % policies are still using soft-fail RLS.', v_missing_rls
        USING ERRCODE = 'P0001';
    END IF;

    -- 2. Check for cascading financial FKs
    SELECT count(*) INTO v_cascading_fk
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace
    WHERE nsp.nspname IN ('storefront', 'governance')
    AND (cl.relname ~ 'order' OR cl.relname ~ 'payment' OR cl.relname ~ 'wallet' OR cl.relname ~ 'invoice')
    AND c.confdeltype = 'c'; -- CASCADE

    IF v_cascading_fk > 0 THEN
        RAISE EXCEPTION 'Compliance Violation: % financial foreign keys are still set to CASCADE.', v_cascading_fk
        USING ERRCODE = 'P0005';
    END IF;

    RAISE NOTICE 'Forensic Audit: 100% COMPLIANCE VERIFIED.';
END;
$$ LANGUAGE plpgsql;
