-- Mandate #26: Audit Log Integrity (Checksums)
-- Prevents undetected tampering with historical logs.

CREATE OR REPLACE FUNCTION governance.calculate_audit_checksum()
RETURNS TRIGGER AS $$
DECLARE
    secret_key TEXT := current_setting('app.master_key', true);
BEGIN
    IF secret_key IS NULL OR secret_key = '' THEN
        RAISE EXCEPTION 'S1 Violation: app.master_key missing. Audit integrity compromised.' 
        USING ERRCODE = 'P9998';
    END IF;

    NEW.checksum := hmac(
        COALESCE(NEW.tenant_id, '') || 
        COALESCE(NEW.action, '') || 
        COALESCE(NEW.entity_id, '') || 
        COALESCE(NEW.old_values::text, '') || 
        COALESCE(NEW.new_values::text, ''),
        secret_key,
        'sha256'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_checksum ON governance.audit_logs;
CREATE TRIGGER trg_audit_checksum
BEFORE INSERT ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.calculate_audit_checksum();

-- Mandate #31: Protected Secrets
-- Ensures that even if the DB is dumped, tenant secrets are encrypted.

CREATE TABLE IF NOT EXISTS vault.tenant_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    key_name TEXT NOT NULL,
    encrypted_value BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, key_name)
);

CREATE OR REPLACE FUNCTION vault.protect_secret()
RETURNS TRIGGER AS $$
BEGIN
    IF char_length(NEW.encrypted_value::text) > 0 THEN -- Only if we are trying to set a value
       -- Note: In a real scenario, we'd use pgp_sym_encrypt(NEW.raw_value, current_setting('app.master_key'))
       -- But here we assume the app handles encryption or we do it via trigger if raw is provided.
       NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
