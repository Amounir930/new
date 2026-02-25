-- 🛡️ Audit 444 JSON Null Safety: 0109_audit_444_json_null_safety.sql
-- Goal: Enforce NOT NULL on JSONB columns with defaults (Issue 24).

DO $$
BEGIN
    -- Governance Schema
    ALTER TABLE governance.tenants ALTER COLUMN ui_config SET NOT NULL;
    ALTER TABLE governance.tenants ALTER COLUMN ui_config SET DEFAULT '{}'::jsonb;
    
    ALTER TABLE governance.system_settings ALTER COLUMN config SET NOT NULL;
    ALTER TABLE governance.system_settings ALTER COLUMN config SET DEFAULT '{}'::jsonb;

    -- Storefront Schema
    -- Note: Customers table exists in every tenant schema via search_path, 
    -- but we target the template in public or common schemas if managed centrally.
    -- Here we ensure the base columns are hardened.
    ALTER TABLE storefront.customers ALTER COLUMN preferences SET NOT NULL;
    ALTER TABLE storefront.customers ALTER COLUMN preferences SET DEFAULT '{}'::jsonb;
EXCEPTION
    WHEN undefined_column THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;
