-- Mandate #21: S7 Encryption Key Rotation (DEK/KEK)
-- Implements active/deprecated key versioning to allow for rolling key rotations without downtime.

CREATE OR REPLACE FUNCTION vault.rotate_tenant_key(t_id UUID, new_encrypted_key TEXT)
RETURNS VOID AS $$
BEGIN
    -- 1. Deprecate existing active key
    UPDATE vault.encryption_keys 
    SET is_active = false, rotated_at = now() 
    WHERE tenant_id = t_id AND is_active = true;

    -- 2. Insert new key version
    INSERT INTO vault.encryption_keys (tenant_id, rotated_at, key_version, is_active, algorithm, encrypted_key)
    SELECT t_id, now(), COALESCE(MAX(key_version), 0) + 1, true, 'AES-256-GCM', new_encrypted_key
    FROM vault.encryption_keys WHERE tenant_id = t_id;
END;
$$ LANGUAGE plpgsql;

-- Mandate #23: DB-level Rate Limiting Tracking (Fallback for Redis)
-- Uses an UNLOGGED table for high-performance hit tracking to prevent disk bloat.

CREATE UNLOGGED TABLE IF NOT EXISTS governance.rate_limit_hits (
    tenant_id UUID NOT NULL,
    hit_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    ip_address INET,
    endpoint TEXT
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_recent ON governance.rate_limit_hits (tenant_id, hit_at);

-- Cleanup function to keep the table lean
CREATE OR REPLACE FUNCTION governance.cleanup_rate_limit_hits()
RETURNS VOID AS $$
BEGIN
    DELETE FROM governance.rate_limit_hits WHERE hit_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
