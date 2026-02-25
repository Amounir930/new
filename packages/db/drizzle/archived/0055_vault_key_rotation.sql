-- 🚨 Audit 999 Vault Hardening: 0055_vault_key_rotation.sql

-- 1. Tenant Key Rotation (Audit Point #8)
CREATE OR REPLACE FUNCTION vault.rotate_tenant_key(
    target_tenant_id UUID,
    new_key_material BYTEA
)
RETURNS void AS $$
BEGIN
    -- 1. Security Check
    IF current_setting('app.role', true) != 'super_admin' THEN
        RAISE EXCEPTION 'S1 Violation: Unauthorized key rotation attempt' USING ERRCODE = 'P0009';
    END IF;

    -- 2. Deprecate existing active key
    UPDATE vault.encryption_keys 
    SET is_active = false, 
        rotated_at = now() 
    WHERE tenant_id = target_tenant_id AND is_active = true;

    -- 3. Insert new key
    INSERT INTO vault.encryption_keys (tenant_id, key_material, is_active, created_at)
    VALUES (target_tenant_id, new_key_material, true, now());

    RAISE NOTICE 'S7: Key rotated for tenant %. Old keys preserved for decryption.', target_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
