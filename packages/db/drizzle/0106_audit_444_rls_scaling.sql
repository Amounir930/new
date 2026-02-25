-- 🚀 Audit 444 RLS Scaling: 0106_audit_444_rls_scaling.sql
-- Goal: Transform RLS from O(N) to O(1) using session-local settings.

-- 1. Enable RLS on core tables (ensure it's on)
ALTER TABLE storefront.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.customers ENABLE ROW LEVEL SECURITY;

-- 2. Refactor Policies to use current_setting('app.current_tenant')
-- DROP existing broad policies if they exist (standard names used by Drizzle/Manual)
DROP POLICY IF EXISTS "tenant_isolation" ON storefront.orders;
DROP POLICY IF EXISTS "tenant_isolation" ON storefront.products;
DROP POLICY IF EXISTS "tenant_isolation" ON storefront.customers;

-- 3. Create O(1) Policies
CREATE POLICY "tenant_isolation_orders" ON storefront.orders
    USING (tenant_id::text = current_setting('app.current_tenant', false));

CREATE POLICY "tenant_isolation_products" ON storefront.products
    USING (tenant_id::text = current_setting('app.current_tenant', false));

CREATE POLICY "tenant_isolation_customers" ON storefront.customers
    USING (tenant_id::text = current_setting('app.current_tenant', false));

-- 4. Governance RLS (O(1) Alignment)
ALTER TABLE governance.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON governance.tenants;
CREATE POLICY "tenant_isolation_governance" ON governance.tenants
    USING (id::text = current_setting('app.current_tenant', false));
