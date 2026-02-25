-- 🛡️ V6 ENTERPRISE ZERO-TRUST AUDIT - COVERING INDEXES (MANDATE #17)

-- Mandate: Append .including(table.basePrice, table.slug, table.name) to enable Index-Only Scans.
-- Drizzle ORM TypeScript support for INCLUDE clauses can vary by version.
-- We enforce this explicitly at the DB Engine level via Raw SQL to guarantee Index-Only scans.

-- Drop the generic index created by Drizzle (if it exists)
DROP INDEX IF EXISTS storefront.idx_products_active;

-- Create the covering index explicitly locking the INCLUDE clause
CREATE INDEX idx_products_active 
ON storefront.products (is_active) 
INCLUDE (base_price, slug, name, main_image) 
WHERE deleted_at IS NULL;
