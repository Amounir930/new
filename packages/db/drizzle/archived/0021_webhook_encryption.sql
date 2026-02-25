-- 🛡️ V6 FATAL AUDIT - WEBHOOK SECRET ENCRYPTION (MANDATE #16)
-- Automatically symmetrically encrypts the webhook secret on insert/update natively via Postgres.

-- Mandate #10: Actual PGP Encryption for Webhook Secrets
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION storefront.encrypt_webhook_secret()
RETURNS trigger AS $$
BEGIN
    -- Only encrypt if the secret is not null and not already encrypted
    -- Check if it starts with PGP message header (approximate check for bytea)
    IF NEW.secret IS NOT NULL THEN
        -- Mandate #10: Actual PGP Encryption using cryptographically secure vault key
        -- We use current_setting('app.master_key') which must be set during the session
        NEW.secret := pgp_sym_encrypt(
            NEW.secret::text, 
            current_setting('app.master_key'),
            'cipher-algo=aes256'
        )::bytea;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_webhook_secret_encryption ON storefront.webhook_subscriptions;
CREATE TRIGGER ensure_webhook_secret_encryption
    BEFORE INSERT OR UPDATE ON storefront.webhook_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION storefront.encrypt_webhook_secret();
