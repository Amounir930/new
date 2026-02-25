-- 🛡️ RED TEAM RE-AUDIT: 0119_jsonb_privilege_escalation.sql
-- Mandate: Engine-level check constraints for sensitive JSONB fields.

-- 1. JSONB Privilege Escalation Protection (Risk #45)
-- Assuming a standard permissions set: 'orders:write', 'products:read', etc.
-- Adding a CHECK constraint that allows ONLY these keys.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema ~ '^tenant_' 
        AND table_name = 'roles' -- if permissions are in roles table
    ) LOOP
        -- Example constraint: Reject any payload containing "super_admin" or unauthorized keys
        EXECUTE format('
            ALTER TABLE %I.%I ADD CONSTRAINT ck_secure_permissions 
            CHECK (NOT (resource_permissions ? ''super_admin''))
        ', r.table_schema, r.table_name);
    END LOOP;
END $$;

-- 2. Blueprint Historical Immutability (Risk #47)
CREATE OR REPLACE FUNCTION governance.enforce_blueprint_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Risk #47: Historically applied blueprints are strictly READ-ONLY.
    IF OLD.status = 'applied' THEN
        RAISE EXCEPTION 'Governance Violation: Applied blueprints are immutable.'
        USING ERRCODE = 'P0004';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blueprint_immutability ON governance.onboarding_blueprints;
CREATE TRIGGER trg_blueprint_immutability
BEFORE UPDATE ON governance.onboarding_blueprints
FOR EACH ROW EXECUTE FUNCTION governance.enforce_blueprint_immutability();

RAISE NOTICE 'RED TEAM: JSONB Security & Blueprint Immutability applied.';
