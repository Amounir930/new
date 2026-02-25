-- 🚨 Audit Remediation: 0111_final_governance_rls.sql
-- Risk #4: Prevent cross-admin data bleeding in governance tables.

-- 1. Enable RLS on Governance Tables
ALTER TABLE governance.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance.leads FORCE ROW LEVEL SECURITY;

ALTER TABLE governance.app_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance.app_usage_records FORCE ROW LEVEL SECURITY;

-- 2. Define Policies for Super Admin Access
-- Only roles with super_admin_role (verified via DB-level checks) can see all governance data.

DROP POLICY IF EXISTS admin_governance_access ON governance.leads;
CREATE POLICY admin_governance_access ON governance.leads
    FOR ALL
    TO super_admin_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_usage_access ON governance.app_usage_records;
CREATE POLICY admin_usage_access ON governance.app_usage_records
    FOR ALL
    TO super_admin_role
    USING (true)
    WITH CHECK (true);

-- 3. Restrict Tenant Role from touching these tables entirely
REVOKE ALL ON TABLE governance.leads FROM tenant_role;
REVOKE ALL ON TABLE governance.app_usage_records FROM tenant_role;

RAISE NOTICE 'S2: Governance RLS (Risk #4) applied to leads and usage records.';
