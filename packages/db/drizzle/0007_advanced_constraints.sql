-- 🛡️ V6 FATAL AUDIT - ADVANCED ENTERPRISE CONSTRAINTS (MANDATES #12, #14)

-- MANDATE #12: B2B Tier Collisions (Overlapping Ranges)
-- minQuantity and maxQuantity can overlap between tiers for the same product.
-- MANDATE: Use PostgreSQL's EXCLUDE constraint with int4range(min_quantity, max_quantity).
-- Requires btree_gist extension.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE storefront.b2b_pricing_tiers
ADD CONSTRAINT exclude_overlapping_tiers
EXCLUDE USING gist (
    tenant_id WITH =,
    product_id WITH =,
    company_id WITH =,
    int4range(min_quantity, max_quantity) WITH &&
);


-- MANDATE #14: Customer Tag Case-Sensitivity
-- Tags like ['VIP', 'vip'] will bypass filters. MUST lowercase via Trigger.
CREATE OR REPLACE FUNCTION lowercase_tags_array()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tags IS NOT NULL THEN
        NEW.tags := ARRAY(
            SELECT LOWER(elem) FROM unnest(NEW.tags) AS elem
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Customers table tags
DROP TRIGGER IF EXISTS trg_lowercase_customer_tags ON storefront.customers;
CREATE TRIGGER trg_lowercase_customer_tags
BEFORE INSERT OR UPDATE ON storefront.customers
FOR EACH ROW EXECUTE FUNCTION lowercase_tags_array();

-- Products table tags
DROP TRIGGER IF EXISTS trg_lowercase_product_tags ON storefront.products;
CREATE TRIGGER trg_lowercase_product_tags
BEFORE INSERT OR UPDATE ON storefront.products
FOR EACH ROW EXECUTE FUNCTION lowercase_tags_array();
