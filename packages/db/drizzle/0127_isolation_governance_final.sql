-- 🚨 FATAL HARDENING: Category A & B (Isolation & Governance Final)
-- 0127_isolation_governance_final.sql

-- 1. Lock Public Schema (Risk #6)
-- Prevents any role from creating objects in the public schema by default.
REVOKE CREATE ON SCHEMA public FROM public;

-- 2. Force RLS on all Storefront Tables (Risk #3)
-- Ensures that even the table owner cannot bypass RLS when acting as a tenant.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema ~ '^tenant_') LOOP
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', 'storefront', r.table_name);
    END LOOP;
END $$;

-- 3. Block Mass Wiping (Risk #16)
-- Prevents TRUNCATE on critical governance tables.
CREATE OR REPLACE FUNCTION governance.block_truncate()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Fatal Violation: TRUNCATE is strictly prohibited on critical governance tables.'
    USING ERRCODE = 'P0002';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_tenant_truncate ON governance.tenants;
CREATE TRIGGER trg_block_tenant_truncate
BEFORE TRUNCATE ON governance.tenants
FOR EACH STATEMENT EXECUTE FUNCTION governance.block_truncate();

-- 4. Versioned Blueprint Immutability (Risk #12)
-- Allows Super Admins to upgrade blueprints via versioning while locking older ones.
ALTER TABLE governance.onboarding_blueprints ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1 NOT NULL;
DROP INDEX IF EXISTS governance.idx_blueprint_niche_version;
CREATE UNIQUE INDEX idx_blueprint_niche_version ON governance.onboarding_blueprints (niche_type, version);

CREATE OR REPLACE FUNCTION governance.enforce_blueprint_lock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'applied' OR OLD.status = 'deprecated' THEN
        RAISE EXCEPTION 'Fatal Violation: Blueprint (%, v%) is locked and immutable.'
        USING ERRCODE = 'P0002', DETAIL = NEW.niche_type || ', ' || OLD.version;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blueprint_lock ON governance.onboarding_blueprints;
CREATE TRIGGER trg_blueprint_lock
BEFORE UPDATE ON governance.onboarding_blueprints
FOR EACH ROW EXECUTE FUNCTION governance.enforce_blueprint_lock();

RAISE NOTICE 'Category A/B: Physical Isolation & Governance Locks Applied.';
