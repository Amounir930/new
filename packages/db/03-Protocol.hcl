// ==========================================
// ELITE SECURITY: FORCED RLS ACTIVATION 
// Protocol: RESTRICTIVE | Scope: STOREFRONT
// ==========================================

sql "rls_02_catalog_inventory" {
  schema = schema.storefront
  as     = <<SQL
-- Categories
ALTER TABLE storefront.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.categories;
CREATE POLICY tenant_isolation_policy ON storefront.categories 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR current_user = 'postgres');

-- Brands
ALTER TABLE storefront.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.brands FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.brands;
CREATE POLICY tenant_isolation_policy ON storefront.brands 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR current_user = 'postgres');

-- Products
ALTER TABLE storefront.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.products FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.products;
CREATE POLICY tenant_isolation_policy ON storefront.products 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR current_user = 'postgres');

-- Product Variants
ALTER TABLE storefront.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_variants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_variants;
CREATE POLICY tenant_isolation_policy ON storefront.product_variants 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR current_user = 'postgres');

-- Product Images
ALTER TABLE storefront.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_images FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_images;
CREATE POLICY tenant_isolation_policy ON storefront.product_images 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Product Attributes
ALTER TABLE storefront.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_attributes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_attributes;
CREATE POLICY tenant_isolation_policy ON storefront.product_attributes 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Entity Metafields
ALTER TABLE storefront.entity_metafields ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.entity_metafields FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.entity_metafields;
CREATE POLICY tenant_isolation_policy ON storefront.entity_metafields 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Search Synonyms
ALTER TABLE storefront.search_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.search_synonyms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.search_synonyms;
CREATE POLICY tenant_isolation_policy ON storefront.search_synonyms 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Smart Collections
ALTER TABLE storefront.smart_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.smart_collections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.smart_collections;
CREATE POLICY tenant_isolation_policy ON storefront.smart_collections 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Locations
ALTER TABLE storefront.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.locations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.locations;
CREATE POLICY tenant_isolation_policy ON storefront.locations 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Inventory Levels
ALTER TABLE storefront.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_levels FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_levels;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_levels 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Inventory Movements
ALTER TABLE storefront.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_movements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_movements;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_movements 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Inventory Reservations
ALTER TABLE storefront.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_reservations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_reservations;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_reservations 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Inventory Transfers
ALTER TABLE storefront.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_transfers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_transfers;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_transfers 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Inventory Transfer Items
ALTER TABLE storefront.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_transfer_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_transfer_items;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_transfer_items 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Suppliers
ALTER TABLE storefront.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.suppliers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.suppliers;
CREATE POLICY tenant_isolation_policy ON storefront.suppliers 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Purchase Orders
ALTER TABLE storefront.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.purchase_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.purchase_orders;
CREATE POLICY tenant_isolation_policy ON storefront.purchase_orders 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- Purchase Order Items
ALTER TABLE storefront.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.purchase_order_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.purchase_order_items;
CREATE POLICY tenant_isolation_policy ON storefront.purchase_order_items 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- B2B Companies
ALTER TABLE storefront.b2b_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.b2b_companies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.b2b_companies;
CREATE POLICY tenant_isolation_policy ON storefront.b2b_companies 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR current_user = 'postgres');

-- B2B Pricing Tiers
ALTER TABLE storefront.b2b_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.b2b_pricing_tiers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.b2b_pricing_tiers;
CREATE POLICY tenant_isolation_policy ON storefront.b2b_pricing_tiers 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');

-- B2B Users
ALTER TABLE storefront.b2b_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.b2b_users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.b2b_users;
CREATE POLICY tenant_isolation_policy ON storefront.b2b_users 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR current_user = 'postgres');
SQL
}
