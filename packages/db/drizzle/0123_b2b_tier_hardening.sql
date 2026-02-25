-- 🚨 FATAL HARDENING: Category C (Financial - B2B Continued)
-- 0123_b2b_tier_hardening.sql

-- 1. B2B Tier Collision Prevention (Risk #22)
-- Uses EXCLUDE USING GIST with int4range.
-- Requires btree_gist extension.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE storefront.b2b_pricing_tiers DROP CONSTRAINT IF EXISTS exclude_b2b_tier_overlap;
ALTER TABLE storefront.b2b_pricing_tiers 
ADD CONSTRAINT exclude_b2b_tier_overlap
EXCLUDE USING GIST (
    company_id WITH =,
    product_id WITH =,
    int4range(min_quantity, COALESCE(max_quantity, 2147483647), '[]') WITH &&
);

RAISE NOTICE 'Category C: B2B Tier Collision Guard Applied.';
