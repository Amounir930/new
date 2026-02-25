-- 🛡️ V6 FATAL AUDIT - CART ID BRUTE FORCING (MANDATE #17)
-- Carts MUST require a session_token verification dynamically against current_setting,
-- bypassing the global tenant-only verification to require the user session explicitly.

-- Replaces the standard tenant_isolation policy applied generically by 0003_rls_lockdown
-- with a stricter cart policy that enforces session matching.

DROP POLICY IF EXISTS tenant_isolation ON storefront.carts;

CREATE POLICY secure_cart_access 
ON storefront.carts FOR ALL 
USING (
    tenant_id::text = current_setting('app.current_tenant', false)
    AND EXISTS (SELECT 1 FROM governance.tenants WHERE id::text = tenant_id::text AND status = 'active')
    AND session_id = current_setting('app.session_id', true)
    OR current_setting('app.role', false) = 'super_admin'
);
