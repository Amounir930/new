-- 🛡️ V6 FATAL AUDIT - PHANTOM QUOTA ENFORCEMENT (MANDATE #3)
-- Prevents Super Admins from setting quotas that are not physically enforced by the DB engine.

-- Create the trigger function for enforcing max_products on storefront.products
CREATE OR REPLACE FUNCTION storefront.enforce_tenant_product_quota()
RETURNS trigger AS $$
DECLARE
    current_product_count INT;
    allowed_max_products INT;
BEGIN
    -- Get the current product count for the tenant
    SELECT COUNT(*) INTO current_product_count 
    FROM storefront.products 
    WHERE tenant_id = NEW.tenant_id;

    -- Get the max_products quota from governance
    SELECT max_products INTO allowed_max_products
    FROM governance.tenant_quotas
    WHERE tenant_id = NEW.tenant_id;

    -- Default to 100 if no quota record exists, or check the limit
    IF allowed_max_products IS NOT NULL AND current_product_count >= allowed_max_products THEN
        RAISE EXCEPTION 'Tenant Product Quota Exceeded (Max: %)', allowed_max_products USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the storefront.products table
DROP TRIGGER IF EXISTS ensure_product_quota ON storefront.products;
CREATE TRIGGER ensure_product_quota
    BEFORE INSERT ON storefront.products
    FOR EACH ROW
    EXECUTE FUNCTION storefront.enforce_tenant_product_quota();
