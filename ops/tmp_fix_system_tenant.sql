-- Emergency System Tenant Fix
BEGIN;

-- Insert system tenant
INSERT INTO governance.tenants (
    id, subdomain, name, status, plan, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system',
    'System Tenant',
    'active',
    'free',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET status = 'active', updated_at = NOW();

-- Verify
SELECT id, subdomain, status, plan FROM governance.tenants WHERE id = '00000000-0000-0000-0000-000000000000';

-- Count active tenants
SELECT COUNT(*) as active_tenant_count FROM governance.tenants WHERE status = 'active';

COMMIT;
