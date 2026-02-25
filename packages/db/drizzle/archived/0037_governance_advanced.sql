-- Mandate #8: Read-Only Blueprints
-- Mandate #11: Domain Verification Enforcement
-- Mandate #12: Global Maintenance Mode (Kill-Switch)

-- 1. Immutability for Applied Blueprints (Mandate #8)
CREATE OR REPLACE FUNCTION governance.prevent_blueprint_alteration()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'applied' AND (
        TG_OP = 'DELETE' OR 
        (TG_OP = 'UPDATE' AND (
            NEW.ui_config IS DISTINCT FROM OLD.ui_config 
            OR NEW.status IS DISTINCT FROM OLD.status
        ))
    ) THEN
        RAISE EXCEPTION 'Governance Violation: Applied blueprints are strictly immutable to preserve historical integrity'
        USING ERRCODE = 'P0011';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mandate #5: Super Admin Global Access (Grant vs RLS)
-- This eliminates the lockout risk where RLS on governance tables blocked management
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'super_admin') THEN
        GRANT USAGE ON SCHEMA governance TO super_admin;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA governance TO super_admin;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA governance TO super_admin;
    END IF;
END $$;

-- CREATE TRIGGER trg_blueprint_immutable BEFORE UPDATE OR DELETE ON governance.onboarding_blueprints FOR EACH ROW EXECUTE FUNCTION governance.prevent_blueprint_alteration();

-- 2. Domain Verification Enforcement (Mandate #11)
-- Prevents setting a custom_domain without a verified timestamp
CREATE OR REPLACE FUNCTION governance.enforce_domain_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.custom_domain IS NOT NULL AND NEW.domain_verified_at IS NULL THEN
        RAISE EXCEPTION 'Security Violation: Custom domains MUST be verified before activation'
        USING ERRCODE = 'P0012';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_tenant_domain_verify BEFORE INSERT OR UPDATE ON governance.tenants FOR EACH ROW EXECUTE FUNCTION governance.enforce_domain_verification();

-- 3. Global Maintenance Mode Enforcement (Mandate #12)
-- Injects a check into the context validation
CREATE OR REPLACE FUNCTION governance.check_global_maintenance()
RETURNS void AS $$
DECLARE
    is_maintenance BOOLEAN;
BEGIN
    SELECT COALESCE((config->>'maintenance_mode')::BOOLEAN, false) INTO is_maintenance 
    FROM governance.system_settings LIMIT 1;

    IF is_maintenance AND current_setting('app.role', true) != 'super_admin' THEN
        RAISE EXCEPTION 'System Notice: The platform is currently under global maintenance. Please try again later.'
        USING ERRCODE = 'P0013';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Integrate into core validation
-- ALTER FUNCTION storefront.validate_session_context() ... (will be done in a rolling update)
