-- Mandate #18: Blueprint Immutability (Versioning)
-- Ensures that blueprints are versioned and cannot be overwritten without incrementing.

ALTER TABLE governance.onboarding_blueprints ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE OR REPLACE FUNCTION governance.enforce_blueprint_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.version IS NOT NULL AND NEW.version <= OLD.version THEN
        RAISE EXCEPTION 'S1 Violation: Blueprint version must be incremented on every update.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blueprint_version ON governance.onboarding_blueprints;
CREATE TRIGGER trg_blueprint_version
BEFORE UPDATE ON governance.onboarding_blueprints
FOR EACH ROW EXECUTE FUNCTION governance.enforce_blueprint_version();

-- Mandate #19: Plan Change Audit Trail
-- Tracks every subscription change for financial and security auditing.

CREATE OR REPLACE FUNCTION governance.audit_plan_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.plan <> NEW.plan THEN
        INSERT INTO governance.plan_change_history (
            tenant_id, 
            from_plan, 
            to_plan, 
            reason, 
            changed_by
        ) VALUES (
            NEW.id, 
            OLD.plan, 
            NEW.plan, 
            'Automatic policy enforcement',
            current_setting('app.role', true)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_plan_change ON governance.tenants;
CREATE TRIGGER trg_audit_plan_change
AFTER UPDATE ON governance.tenants
FOR EACH ROW EXECUTE FUNCTION governance.audit_plan_change();

-- Mandate #28: Dynamic CORS Whitelist
-- Moves CORS configuration to the DB to prevent wildcard vulnerabilities.

CREATE TABLE IF NOT EXISTS governance.cors_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL for global, ID for specific tenant
    origin TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, origin)
);
