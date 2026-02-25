-- Mandate #13: Vault Security Lockdown
-- Only 'system' role can read/write encryption keys.

ALTER TABLE vault.encryption_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vault_system_isolation ON vault.encryption_keys;

CREATE POLICY vault_system_isolation
ON vault.encryption_keys
FOR ALL
TO PUBLIC
USING (
  current_setting('app.role', true) = 'system'
)
WITH CHECK (
  current_setting('app.role', true) = 'system'
);

-- Ensure table owner doesn't bypass if we are using a non-superuser role for apps
ALTER TABLE vault.encryption_keys FORCE ROW LEVEL SECURITY;
