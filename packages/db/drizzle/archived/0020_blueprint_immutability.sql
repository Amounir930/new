-- Mandate #20: Blueprint Immutability
-- Prevents modification of a blueprint if it has already been applied to one or more tenants.
-- This ensures that tenant environments are consistent with the blueprint version they were provisioned with.

CREATE OR REPLACE FUNCTION governance.prevent_blueprint_modification()
RETURNS TRIGGER AS $$
DECLARE
    v_usage_count INTEGER;
BEGIN
    -- 1. Check if ANY tenant is currently using this nicheType
    -- This assumes nicheType is the identifier in onboarding_blueprints
    SELECT count(*) INTO v_usage_count
    FROM governance.tenants
    WHERE niche_type = OLD.niche_type;

    -- 2. Enforce Immutability
    IF v_usage_count > 0 THEN
        RAISE EXCEPTION 'BLUEPRINT_IMMUTABLE: Blueprint % cannot be modified or deleted because it is applied to % active tenants.', 
            OLD.niche_type, v_usage_count
        USING ERRCODE = 'P0003';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attachment:
DROP TRIGGER IF EXISTS trg_blueprint_immutability ON governance.onboarding_blueprints;

CREATE TRIGGER trg_blueprint_immutability
BEFORE UPDATE OR DELETE ON governance.onboarding_blueprints
FOR EACH ROW
EXECUTE FUNCTION governance.prevent_blueprint_modification();
