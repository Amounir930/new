-- 🛡️ Apex v2 — Zero-Trust Row Level Security (RLS) (Mandate #1 & #2)
-- Scope: Storefront Tenant Isolation + Instant Suspension Guard.

-- 1. Tenant Registry Helper (Internal Governance)
-- Ensure 'active' status check is cached/fast.

-- 2. ENABLE RLS ON ALL STOREFRONT TABLES
-- (The following is a generalized template for all tenant tables)

-- DO $$ 
-- DECLARE 
--     r RECORD;
-- BEGIN
--     FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'storefront') LOOP
--         EXECUTE format('ALTER TABLE storefront.%I ENABLE ROW LEVEL SECURITY', r.tablename);
--         -- Audit 999 Point #3: Only dropping to prevent conflict with 0099
--         EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.%I', r.tablename);
--     END LOOP;
-- END $$;

-- 3. SPECIFIC EXAMPLES (Manual Overrides for specific isolation rules)
-- ALTER TABLE storefront.products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY product_isolation ON storefront.products
-- USING (tenant_id::text = current_setting('app.current_tenant')
-- AND (SELECT status FROM governance.tenants WHERE id::text = current_setting('app.current_tenant')) = 'active');
