-- 🛡️ Audit Remediation: 0112_salt_rotation_foundation.sql
-- Risk #10: Salt rotation for blind indices every 90 days.

-- 1. Add Salt Rotation Columns to Tenants
ALTER TABLE governance.tenants 
ADD COLUMN IF NOT EXISTS salt_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_secret_salt TEXT;

-- 2. Audit Trail for Rotation
COMMENT ON COLUMN governance.tenants.salt_version IS 'Increments on every 90-day PII salt rotation.';
COMMENT ON COLUMN governance.tenants.previous_secret_salt IS 'Stores old salt during 24-hour migration window.';

RAISE NOTICE 'S7: Salt Rotation Foundation (Risk #10) applied successfully.';
