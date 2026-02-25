-- 🛡️ V6 ENTERPRISE MULTI-TENANT FATAL AUDIT - DEFERRED FOREIGN KEYS (MANDATE #19)

-- Bulk importing 50k products via CSV drops performance and causes deadlocks due to immediate FK validation.
-- MANDATE: Alter categoryId and brandId constraints on storefront.products to DEFERRABLE INITIALLY DEFERRED.

DO $$
DECLARE
    fk_brand TEXT;
    fk_category TEXT;
BEGIN
    -- 1. Identify the foreign key constraint names dynamically
    SELECT constraint_name INTO fk_brand
    FROM information_schema.key_column_usage
    WHERE table_schema = 'storefront'
      AND table_name = 'products'
      AND column_name = 'brand_id'
      AND position_in_unique_constraint IS NOT NULL;
      
    SELECT constraint_name INTO fk_category
    FROM information_schema.key_column_usage
    WHERE table_schema = 'storefront'
      AND table_name = 'products'
      AND column_name = 'category_id'
      AND position_in_unique_constraint IS NOT NULL;

    -- 2. Alter the constraints if they exist
    IF fk_brand IS NOT NULL THEN
        EXECUTE format('ALTER TABLE storefront.products ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED;', fk_brand);
    END IF;

    IF fk_category IS NOT NULL THEN
        EXECUTE format('ALTER TABLE storefront.products ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED;', fk_category);
    END IF;
END $$;
