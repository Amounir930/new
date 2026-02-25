-- 🛡️ V6 FATAL AUDIT - LOGISTICS DATA BLEED (MANDATE #19)
-- Explicitly validates both origin and destination locations for transfers.

DROP POLICY IF EXISTS logistics_isolation ON storefront.inventory_transfers;

CREATE POLICY logistics_isolation 
ON storefront.inventory_transfers FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM storefront.store_locations origin
        WHERE origin.id = origin_location_id 
        AND origin.tenant_id::text = current_setting('app.current_tenant', false)
    )
    AND EXISTS (
        SELECT 1 
        FROM storefront.store_locations dest
        WHERE dest.id = destination_location_id 
        AND dest.tenant_id::text = current_setting('app.current_tenant', false)
    )
    AND EXISTS (SELECT 1 FROM governance.tenants WHERE id::text = current_setting('app.current_tenant', false) AND status = 'active')
    OR current_setting('app.role', false) = 'super_admin'
);
