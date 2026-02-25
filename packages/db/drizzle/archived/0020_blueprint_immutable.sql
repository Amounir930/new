-- 🛡️ V6 FATAL AUDIT - BLUEPRINT IMMUTABILITY (MANDATE #10)
-- Makes onboarding blueprints strictly read-only after they have been applied

-- 1. Ensure the table exists (it might not be formally defined in the main TS schema currently)
CREATE TABLE IF NOT EXISTS governance.onboarding_blueprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES governance.tenants(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    status blueprint_status NOT NULL DEFAULT 'applied',
    configuration jsonb NOT NULL
);

-- 2. Create the immutability trigger
CREATE OR REPLACE FUNCTION governance.enforce_blueprint_immutability()
RETURNS trigger AS $$
BEGIN
    IF OLD.status = 'applied' THEN
        RAISE EXCEPTION 'Blueprint Immutability Breach: Cannot modify an applied onboarding blueprint.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger
DROP TRIGGER IF EXISTS ensure_blueprint_read_only ON governance.onboarding_blueprints;
CREATE TRIGGER ensure_blueprint_read_only
    BEFORE UPDATE OR DELETE ON governance.onboarding_blueprints
    FOR EACH ROW
    EXECUTE FUNCTION governance.enforce_blueprint_immutability();
