-- Restoration: PostgreSQL Specialized Types and Indices

-- 1. Restore Custom Composite Type
CREATE TYPE public.money_amount AS (
  amount bigint,
  currency char(3)
);

-- 2. Restore Columns (Convert text/decimal back to specialized types)
ALTER TABLE storefront.categories ALTER COLUMN path TYPE public.ltree USING path::public.ltree;
ALTER TABLE storefront.products ALTER COLUMN embedding TYPE public.vector(1536) USING embedding::public.vector;
ALTER TABLE storefront.product_variants ALTER COLUMN embedding TYPE public.vector(1536) USING embedding::public.vector;
ALTER TABLE storefront.customer_addresses ALTER COLUMN coordinates TYPE public.geography(point, 4326) USING coordinates::public.geography;
ALTER TABLE storefront.locations ALTER COLUMN coordinates TYPE public.geography(point, 4326) USING coordinates::public.geography;

-- 3. Restore Complex Indices (GIN/GIST/HNSW)
CREATE INDEX idx_cat_name_trgm ON storefront.categories USING GIN ((name->>'ar') gin_trgm_ops);
CREATE INDEX idx_categories_path_gist ON storefront.categories USING GIST (path);
CREATE INDEX idx_brand_name_trgm ON storefront.brands USING GIN ((name->>'ar') gin_trgm_ops);
CREATE INDEX idx_attrs_value_trgm ON storefront.product_attributes USING GIN (attribute_value gin_trgm_ops);
CREATE INDEX idx_metafields_value_gin ON storefront.entity_metafields USING GIN (value);
CREATE INDEX idx_locations_coordinates_gist ON storefront.locations USING GIST (coordinates);
CREATE INDEX idx_customer_addresses_location_gist ON storefront.customer_addresses USING GIST (coordinates);
CREATE INDEX idx_abandoned_items_gin ON storefront.abandoned_checkouts USING GIN (items);

-- 4. Restore Vector Indices (HNSW)
CREATE INDEX idx_products_embedding_cosine ON storefront.products USING HNSW (embedding vector_cosine_ops) WITH (m=24, ef_construction=128);
CREATE INDEX idx_variants_embedding_cosine ON storefront.product_variants USING HNSW (embedding vector_cosine_ops) WITH (m=24, ef_construction=128);

-- 5. Restore Exclusion Constraints (Requires btree_gist)
ALTER TABLE storefront.flash_sale_products ADD CONSTRAINT idx_flash_prod_overlap_prevent EXCLUDE USING GIST (flash_sale_id WITH =, product_id WITH =, tenant_id WITH =);
ALTER TABLE storefront.price_list_items ADD CONSTRAINT idx_price_list_overlap_prevent EXCLUDE USING GIST (price_list_id WITH =, product_id WITH =, tenant_id WITH =);
ALTER TABLE storefront.b2b_pricing_tiers ADD CONSTRAINT idx_b2b_overlap_prevent EXCLUDE USING GIST (tenant_id WITH =, company_id WITH =, product_id WITH =, quantity_range WITH &&);
CREATE INDEX idx_b2b_tier_collision ON storefront.b2b_pricing_tiers USING GIST (min_quantity, max_quantity);
