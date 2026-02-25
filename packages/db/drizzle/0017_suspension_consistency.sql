-- Mandate #17: Suspension Timestamp Consistency
-- Ensures that suspended_at is ONLY set when status is 'suspended', and vice versa.

ALTER TABLE governance.tenants 
ADD CONSTRAINT check_tenant_status_suspended 
CHECK ((status = 'suspended') = (suspended_at IS NOT NULL));

-- Mandate #17: Reason required for suspension
ALTER TABLE governance.tenants
ADD CONSTRAINT check_tenant_suspension_reason
CHECK (status != 'suspended' OR suspended_reason IS NOT NULL);
