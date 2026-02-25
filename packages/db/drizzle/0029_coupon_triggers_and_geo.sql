-- 🛡️ V6 FATAL AUDIT - COUPONS & POSTGIS HARDENING (MANDATES #26, #33, #48)

-- 1. Mandate #26: Coupon Case-Sensitivity Double-Dip
-- Bypassing unique caps by changing string casing.
CREATE OR REPLACE FUNCTION storefront.enforce_uppercase_coupons()
RETURNS trigger AS $$
BEGIN
    NEW.code := UPPER(NEW.code);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_uppercase_coupon_codes ON storefront.discount_codes;
CREATE TRIGGER trg_uppercase_coupon_codes
    BEFORE INSERT OR UPDATE ON storefront.discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION storefront.enforce_uppercase_coupons();

-- 2. Mandate #33 & #48: PostGIS Neural Failure & Spatial Bloat
-- Ensure coordinates are explicitly cast to GEOGRAPHY and GIST indexed natively.
-- (Fallback execution if Drizzle customType fails in certain environments).
ALTER TABLE storefront.locations 
    ALTER COLUMN coordinates TYPE geography(Point, 4326) 
    USING coordinates::geography(Point, 4326);

ALTER TABLE storefront.shipping_zones
    ALTER COLUMN center_point TYPE geography(Point, 4326) 
    USING center_point::geography(Point, 4326);

DROP INDEX IF EXISTS idx_locations_geo_native;
CREATE INDEX idx_locations_geo_native 
ON storefront.locations USING gist (coordinates);

DROP INDEX IF EXISTS idx_shipping_zones_geo_native;
CREATE INDEX idx_shipping_zones_geo_native 
ON storefront.shipping_zones USING gist (center_point);
