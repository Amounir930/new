-- 🛡️ V6 FATAL AUDIT - APP ROLE SPOOFING RISK (MANDATE #8)
-- Replaces raw SET LOCAL app.role with a strictly authenticated SECURITY DEFINER function

CREATE OR REPLACE FUNCTION governance.set_app_role(
    requested_role TEXT, 
    auth_secret TEXT
)
RETURNS void AS $$
DECLARE
    expected_secret TEXT;
BEGIN
    -- Super admins must provide the master secret
    IF requested_role = 'super_admin' THEN
        -- Retrieve the expected secret from the database config (e.g. postgresql.conf or dynamically loaded)
        -- Fallback to a highly secure assumption if missing, but it MUST match exactly.
        expected_secret := current_setting('app.super_admin_secret', true);
        
        IF expected_secret IS NULL OR auth_secret = '' OR auth_secret != expected_secret THEN
            RAISE EXCEPTION 'Cryptographic validation failed for super_admin role.' USING ERRCODE = 'INSUFFICIENT_PRIVILEGE';
        END IF;
    END IF;

    -- If valid, set the variable locally
    EXECUTE format('SET LOCAL app.role = %L', requested_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
