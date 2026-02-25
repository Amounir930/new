-- 🛡️ Apex v2 — Zero-Trust Row Level Security (RLS) (Directive #2)
-- Scope: Storefront Tenant Isolation.

-- 1. ENABLE RLS ON ALL STOREFRONT TABLES
-- This must be executed for EVERY table in the tenant schemas.
-- Example for 'orders':
-- ALTER TABLE storefront.orders ENABLE ROW LEVEL SECURITY;

-- 2. GLOBAL TENANT ISOLATION POLICY
-- Bind to the 'app.current_tenant' session variable set by the middleware.
-- CREATE POLICY tenant_isolation_policy ON storefront.orders
-- USING (tenant_id::text = current_setting('app.current_tenant'));

-- 3. ENFORCEMENT
-- The middleware MUST execute: SET app.current_tenant = 'tenant_123'; 
-- at the start of every transaction.
