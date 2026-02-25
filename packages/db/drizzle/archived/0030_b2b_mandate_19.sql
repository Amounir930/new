-- 🛡️ V6 FATAL AUDIT - B2B TIER OVERLAP CORRUPTION (MANDATE #19)
-- Replaces standard unique indexes with absolute physical range exclusion 
-- to prevent corruption scenarios where pricing tiers overlap.

-- Pre-requisite: btree_gist extension is required to use GIST indices on UUID scalar columns.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE storefront.b2b_pricing_tiers 
ADD CONSTRAINT exclude_b2b_tier_overlap 
EXCLUDE USING gist (
    int4range(min_quantity, max_quantity, '[]') WITH &&,
    company_id WITH =,
    product_id WITH =
);
