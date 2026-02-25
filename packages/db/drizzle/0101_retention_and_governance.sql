-- 🚨 Audit 777 Governance Hardening: 0101_retention_and_governance.sql

-- 1. Audit Log Retention (Audit 777 Point #40)
-- Configure pg_partman to keep only 1 year of audit logs.
-- This requires pg_partman already initialized in 0099.
SELECT partman.create_parent('governance.audit_logs', 'created_at', 'native', 'daily');
UPDATE partman.part_config 
SET retention = '1 year', 
    retention_keep_table = false 
WHERE parent_table = 'governance.audit_logs';

-- 2. Immutable Super Admin Actions (Audit 777 Point #41)
-- Apply the same tamper-protection trigger used for audit logs.
CREATE TRIGGER trg_super_admin_tamper_proof
BEFORE UPDATE OR DELETE ON governance.super_admin_actions
FOR EACH ROW EXECUTE FUNCTION governance.prevent_truncate();

-- 3. Webhook Secret Versioning (Audit 777 Point #10)
ALTER TABLE ecosystem.webhooks 
ADD COLUMN IF NOT EXISTS secret_version INT DEFAULT 1 NOT NULL;

-- 4. GDPR Deletion Logs (Audit 777 Point #9)
CREATE TABLE IF NOT EXISTS governance.gdpr_deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_count INT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
