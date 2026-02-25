-- 🛡️ V6 FATAL AUDIT - OVERLAP & LOWERCASE ENFORCEMENT (MANDATES #44, #46, #47)

-- Mandate #44: Shipping Zones Weight Overlap
-- Prevents overlapping weight tiers within the same shipping method/zone context.
ALTER TABLE storefront.shipping_methods 
ADD CONSTRAINT exclude_weight_overlap 
EXCLUDE USING gist (
    int4range(min_weight_grams, max_weight_grams, '[]') WITH &&,
    zone_id WITH =
);

-- Mandate #46: Tags Array Lowercasing
-- Prevents filter bypass via case-sensitivity (VIP vs vip).
CREATE OR REPLACE FUNCTION storefront.lowercase_tags_array() 
RETURNS trigger AS $$
BEGIN
    IF NEW.tags IS NOT NULL THEN
        NEW.tags := ARRAY(SELECT lower(unnest(NEW.tags)));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lowercase_tags ON storefront.products;
CREATE TRIGGER trg_lowercase_tags
    BEFORE INSERT OR UPDATE ON storefront.products
    FOR EACH ROW
    EXECUTE FUNCTION storefront.lowercase_tags_array();

-- Mandate #47: Flash Sale Date Overlap
-- Ensures no product has overlapping flash sale intervals.
CREATE TABLE IF NOT EXISTS storefront.flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES storefront.products(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    discount_percentage INT CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    CONSTRAINT exclude_flash_sale_overlap 
    EXCLUDE USING gist (
        tsrange(starts_at, ends_at, '[]') WITH &&,
        product_id WITH =
    )
);
