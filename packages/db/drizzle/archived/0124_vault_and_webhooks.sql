-- 🚨 FATAL HARDENING: Category D & E (Vault & Webhooks)
-- 0124_vault_and_webhooks.sql

-- 1. Webhook Key Versioning (Risk #28)
-- Ensures verification works after master key rotations.
ALTER TABLE storefront.webhooks ADD COLUMN IF NOT EXISTS key_version INTEGER DEFAULT 1 NOT NULL;

-- 2. Vault Archival Mechanism (Risk #26)
-- Prevents explosive bloat in the encryption_keys table.
CREATE OR REPLACE FUNCTION vault.archive_expired_keys()
RETURNS void AS $$
BEGIN
    -- Move deactivated keys older than 90 days to an archival state or just clear payload
    -- For now, we clear the encrypted_key but keep the metadata for audit.
    UPDATE vault.encryption_keys 
    SET encrypted_key = '\x'::bytea, 
        algorithm = algorithm || ' (ARCHIVED)'
    WHERE is_active = false 
    AND rotated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the archival sweep
SELECT cron.schedule('vault_key_archival', '0 2 * * *', 'SELECT vault.archive_expired_keys()');

RAISE NOTICE 'Category D/E: Vault Archival and Webhook Versioning Applied.';
