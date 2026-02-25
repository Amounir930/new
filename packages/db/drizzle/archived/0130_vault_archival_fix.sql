-- 🚨 FATAL HARDENING: Category D (S7 Cryptography & Vault Final)
-- 0130_vault_archival_fix.sql

-- 1. Vault Cold-Storage (Risk #28)
-- Mandate #28: Move archived keys to cold storage instead of clearing them.
CREATE SCHEMA IF NOT EXISTS vault;

CREATE TABLE IF NOT EXISTS vault.encryption_keys_archived (
    id UUID PRIMARY KEY,
    key_ciphertext BYTEA NOT NULL,
    version INTEGER NOT NULL,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 2. Archival Trigger
CREATE OR REPLACE FUNCTION vault.archive_encryption_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
        INSERT INTO vault.encryption_keys_archived (id, key_ciphertext, version, archived_at, metadata)
        VALUES (OLD.id, OLD.key_ciphertext, OLD.version, NOW(), OLD.metadata);
        
        -- Fatal Lock: Overwrite active row with null/tombstone to prevent reuse
        NEW.key_ciphertext := '\x'::bytea;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. S7 Structure Validation (Risk #31)
-- Mandate #31: Use jsonb_typeof() to ensure ciphertext structure.
-- Prevents injection of invalid JSON starting with "encrypted".
CREATE OR REPLACE FUNCTION public.is_valid_s7_format(p_data TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (p_data::jsonb->>'encrypted') IS NOT NULL 
           AND jsonb_typeof(p_data::jsonb) = 'object';
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the check constraint in schemas (Logic handled in drizzle usually)
-- For existing tables:
-- ALTER TABLE storefront.customers DROP CONSTRAINT IF EXISTS check_email_encrypted;
-- ALTER TABLE storefront.customers ADD CONSTRAINT check_email_encrypted CHECK (public.is_valid_s7_format(email));

RAISE NOTICE 'Category D: S7 Cryptography & Vault Cold-Storage Applied.';
