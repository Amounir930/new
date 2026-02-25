-- 🚨 FATAL LOCKDOWN: Phase II — Money & Key Rotation
-- 0135_money_and_key_rotation.sql

-- 1. Money Type Enforcement (Risk #10)
-- Mandate: Convert all BIGINT money columns to money_amount to prevent currency de-sync.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name ~ 'price' OR column_name ~ 'balance' OR column_name ~ 'amount'
        AND data_type = 'bigint'
        AND table_schema IN ('storefront', 'governance')
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE money_amount USING (%I, ''SAR'')::money_amount', 
            r.table_schema, r.table_name, r.column_name, r.column_name);
    END LOOP;
END $$;

-- 2. Webhook Key Rotation (Risk #17)
-- Mandate: Implement versioned key rotation for tenant secrets.
CREATE TABLE IF NOT EXISTS vault.tenant_secret_versions (
    id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES governance.tenants(id),
    secret_salt TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, version)
);

CREATE OR REPLACE FUNCTION vault.rotate_tenant_key(p_tenant_id UUID)
RETURNS void AS $$
DECLARE
    v_new_version INTEGER;
    v_new_salt TEXT;
BEGIN
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version 
    FROM vault.tenant_secret_versions WHERE tenant_id = p_tenant_id;
    
    v_new_salt := encode(gen_random_bytes(32), 'hex');

    -- Deactivate old keys
    UPDATE vault.tenant_secret_versions 
    SET is_active = FALSE 
    WHERE tenant_id = p_tenant_id;

    -- Insert new key
    INSERT INTO vault.tenant_secret_versions (tenant_id, secret_salt, version, is_active)
    VALUES (p_tenant_id, v_new_salt, v_new_version, TRUE);

    -- Sync back to main tenant table for backward compatibility
    UPDATE governance.tenants 
    SET secret_salt = v_new_salt, 
        updated_at = NOW() 
    WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Phase II: Money Type Enforcement & Webhook Key Rotation Applied.';
