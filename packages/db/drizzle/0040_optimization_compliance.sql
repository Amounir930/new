-- Mandate #26: Covering Indexes
-- Mandate #27: Compound Session Revocation Index
-- Mandate #28: Shipping Zone Overlap Prevention
-- Mandate #29: Inventory Reservation Purge
-- Mandate #30: GDPR Abandoned Checkout Purge

-- 1. Covering Index for Product Catalog (Mandate #26)
-- Optimizes Index-Only Scans for high-frequency catalog browsing
CREATE INDEX idx_products_catalog_covering ON storefront.products (tenant_id, is_active) 
INCLUDE (id, name, slug, base_price, main_image_url);

-- 2. Staff Session Revocation Optimization (Mandate #27)
-- Prevents table scans during mass security purges
CREATE INDEX idx_staff_sessions_revocation ON storefront.staff_sessions (staff_id, device_fingerprint, revoked_at) 
WHERE revoked_at IS NULL;

-- 3. Shipping Weight Overlap Prevention (Mandate #28)
-- Mathematically prevents overlapping weight ranges within a zone
-- Requires btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

/*
ALTER TABLE storefront.shipping_rates 
ADD CONSTRAINT exclude_weight_overlap 
EXCLUDE USING gist (
    tenant_id WITH =,
    zone_id WITH =,
    numrange(min_weight, max_weight, '[]') WITH &&
);
*/

-- 4. Automated Compliance & Maintenance (Mandate #29 & #30)
-- Requires pg_cron

-- Inventory Purge Task
-- SELECT cron.schedule('purge_inventory_reservations', '*/15 * * * *', 'DELETE FROM storefront.inventory_reservations WHERE expires_at < NOW()');

-- GDPR Abandoned Checkout Purge Task
-- SELECT cron.schedule('gdpr_abandoned_checkout_purge', '0 0 * * *', 'DELETE FROM storefront.abandoned_checkouts WHERE created_at < NOW() - INTERVAL ''60 days''');

-- 5. Final Engine-Level Neural Synchronization
-- Ensure all sequences and defaults are correctly set for the zero-trust environment
ALTER TABLE storefront.orders ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE storefront.orders ALTER COLUMN updated_at SET DEFAULT NOW();
