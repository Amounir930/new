-- Mandate #24: Automated Inventory Reservation Cleanup
-- Mandate #29: B2B Tier Overlap Prevention (requires btree_gist)

-- 1. Inventory Cleanup Procedure
CREATE OR REPLACE FUNCTION storefront.cleanup_expired_reservations()
RETURNS void AS $$
BEGIN
    DELETE FROM storefront.inventory_reservations 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 2. B2B Tier Isolation (Mandate #29)
-- Prevents overlapping discount tiers (e.g., 1-10 units and 5-15 units)
-- Note: Requires CREATE EXTENSION IF NOT EXISTS btree_gist; in migration

/*
ALTER TABLE storefront.b2b_price_tiers
ADD CONSTRAINT exclude_overlapping_tiers
EXCLUDE USING gist (
    tenant_id WITH =,
    variant_id WITH =,
    int4range(min_quantity, max_quantity, '[]') WITH &&
);
*/

-- 3. Affiliate Fraud Prevention (Mandate #28)
CREATE OR REPLACE FUNCTION storefront.prevent_affiliate_self_referral()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if customer email matches affiliate email
    IF EXISTS (
        SELECT 1 FROM storefront.affiliates 
        WHERE id = NEW.affiliate_id AND email = (SELECT email FROM storefront.customers WHERE id = NEW.customer_id)
    ) THEN
        RAISE EXCEPTION 'Affiliate Violation: Self-referral is strictly prohibited'
        USING ERRCODE = 'P0004';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
