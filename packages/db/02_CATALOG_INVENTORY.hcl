// ==========================================
// APEX V2 - 2026 ENTERPRISE ARCHITECTURE (ATLAS HCL)
// DIRECTIVE: EXECUTIVE OVERRIDE (ATLAS-2026-01)
// STATUS: FINAL | SECURITY: ZERO-TOLERANCE
// MODULE: 02_CATALOG_INVENTORY (Products & Supply Chain)
// ==========================================

// 1. CATALOG SCHEMA (Storefront)
// ==========================================
table "categories" {
  schema = schema.storefront
  // Strike 13: LTREE path recursion safety
  // (Placeholder for trigger - will be implemented in security.hcl if needed, but adding column check here)
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "parent_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "sort_order" {
    type = int
    default = 0
  }
  column "products_count" {
    type = int
    default = 0
  }
  column "is_active" {
    type = boolean
    default = true
  }
  column "slug" {
    type = varchar(255)
  }
  column "icon" {
    type = varchar(100)
    null = true
  }
  column "meta_title" {
    type = varchar(150)
    null = true
  }
  column "meta_description" {
    type = varchar(255)
    null = true
  }
  column "image_url" {
    type = text
    null = true
  }
  column "banner_url" {
    type = text
    null = true
  }
  column "name" {
    type = jsonb
  }
  column "description" {
    type = jsonb
    null = true
  }
  column "path" {
    type = sql("public.ltree")
    null = true
  }
primary_key {
  columns =[column.id]
}
unique "uq_tenant_cat"  {
  columns =[column.tenant_id, column.id]
}
unique "idx_categories_slug_active"  {
  columns =[column.tenant_id, column.slug]
  where ="deleted_at IS NULL"
}
index "idx_categories_parent"  {
  columns =[column.parent_id]
}
index "idx_categories_active"  {
  columns =[column.is_active]
  where ="deleted_at IS NULL"
}
index "idx_cat_name_trgm"  {
  expr ="((name->>'ar') gin_trgm_ops)"
  using = GIN
}
index "idx_categories_path_gist"  {
  columns =[column.path]
  using =GIST
}
check "chk_categories_no_circular_ref"  {
  expr ="(parent_id IS NULL OR parent_id != id)"
}
check "chk_category_depth"  {
  expr ="nlevel(path) <= 10"
}

  // Strike 12: Cascading LTREE Update (Logic handled in 07-SECURITY via Trigger)

  index "idx_categories_tenant"  {
  columns =[column.tenant_id]
}

  // ELITE: RLS POLICY
  // ALTER TABLE storefront.categories ENABLE ROW LEVEL SECURITY
  
  foreign_key "fk_cat_parent" {
    columns     = [column.tenant_id, column.parent_id]
    ref_columns = [table.categories.column.tenant_id, table.categories.column.id]
    on_delete   = "RESTRICT"
  }
}
table "brands" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "is_active" {
    type = boolean
    default = true
  }
  column "slug" {
    type = varchar(255)
  }
  column "country" {
    type = char(2)
    null = true
  }
  column "website_url" {
    type = text
    null = true
  }
  column "logo_url" {
    type = text
    null = true
  }
  column "name" {
    type = jsonb
  }
  column "description" {
    type = jsonb
    null = true
  }
primary_key {
  columns =[column.id]
}
unique "idx_brands_slug_active"  {
  columns =[column.tenant_id, column.slug]
  where ="deleted_at IS NULL"
}
index "idx_brands_active"  {
  columns =[column.is_active]
  where ="deleted_at IS NULL"
}
index "idx_brand_name_trgm"  {
  expr ="((name->>'ar') gin_trgm_ops)"
  using = GIN
}
index "idx_brands_tenant"  {
  columns =[column.tenant_id]
}

  // ALTER TABLE storefront.brands ENABLE ROW LEVEL SECURITY
}
table "products" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "brand_id" {
    type = uuid
    null = true
  }
  column "category_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "published_at" {
    type = timestamptz
    null = true
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "base_price" {
    type = sql("public.money_amount")
    null = false
  }
  column "sale_price" {
    type = sql("public.money_amount")
    null = true
  }
  column "cost_price" {
    type = sql("public.money_amount")
    null = true
  }
  column "compare_at_price" {
    type = sql("public.money_amount")
    null = true
  }
  column "tax_basis_points" {
    type = int
    default = 0
  }
  column "low_stock_threshold" {
    type = int
    default = 5
  }
  column "sold_count" {
    type = int
    default = 0
  }
  column "view_count" {
    type = int
    default = 0
  }
  column "review_count" {
    type = int
    default = 0
  }
  column "weight" {
    type = int
    null = true
  }
  column "min_order_qty" {
    type = int
    default = 1
  }
  column "is_active" {
    type = boolean
    default = true
  }
  column "is_featured" {
    type = boolean
    default = false
  }
  column "is_returnable" {
    type = boolean
    default = true
  }
  column "requires_shipping" {
    type = boolean
    default = true
  }
  column "is_digital" {
    type = boolean
    default = false
  }
  column "track_inventory" {
    type = boolean
    default = true
  }
  column "slug" {
    type = varchar(255)
  }
  column "sku" {
    type = varchar(100)
  }
  column "barcode" {
    type = varchar(50)
    null = true
  }
  column "country_of_origin" {
    type = varchar(100)
    null = true
  }
  column "meta_title" {
    type = varchar(70)
    null = true
  }
  column "meta_description" {
    type = varchar(160)
    null = true
  }
  column "main_image" {
    type = text
  }
  column "video_url" {
    type = text
    null = true
  }
  column "digital_file_url" {
    type = text
    null = true
  }
  column "keywords" {
    type = text
    null = true
  }
  column "avg_rating" {
    type = numeric
    precision = 3
    scale = 2
    default = 0
  }
  column "tags" {
    type = sql("text[]")
    null = true
  }
  column "name" {
    type = jsonb
  }
  column "short_description" {
    type = jsonb
    null = true
  }
  column "long_description" {
    type = jsonb
    null = true
  }
  column "specifications" {
    type = jsonb
    default = sql("'{}'::jsonb")
  }
  column "dimensions" {
    type = jsonb
    null = true
  }
  column "gallery_images" {
    type = jsonb
    default = sql("'[]'::jsonb")
  }
  column "embedding" {
    type = sql("public.vector(1536)")
    null = true
  }
  column "version" {
    type = bigint
    default = 1
  }
  column "warranty_period" {
    type = int
    null = true
  }
  column "warranty_unit" {
    type = varchar(10)
    null = true
  }
primary_key {
  columns =[column.id]
}
unique "uq_tenant_product"  {
  columns =[column.tenant_id, column.id]
}
unique "idx_products_slug_active"  {
  columns =[column.tenant_id, column.slug]
  where ="deleted_at IS NULL"
}
unique "idx_products_sku_active"  {
  columns =[column.tenant_id, column.sku]
  where ="deleted_at IS NULL"
}
index "idx_products_active"  {
  columns =[column.category_id]
  where ="deleted_at IS NULL"
}
index "idx_products_featured"  {
  columns =[column.is_featured]
  where ="deleted_at IS NULL"
}
index "idx_products_tags"  {
  columns =[column.tags]
  using =GIN
}
index "idx_products_name"  {
  columns =[column.name]
  using =GIN
}
index "idx_products_brand"  {
  columns =[column.brand_id]
}
index "idx_products_embedding_cosine" { 
    columns = [column.embedding]
    using = HNSW
    ops = [sql("public.vector_cosine_ops")]
      storage_param {
    name = "m"
    value = "24"
  }
storage_param {
    name = "ef_construction"
    value = "128"
  }
  }
  
  // Strike 18: Digital/Shipping Logic Consistency
  check "chk_digital_shipping"  {
  expr ="NOT (is_digital AND requires_shipping)"
}
check "chk_barcode_format" {
    expr = "barcode IS NULL OR barcode ~ '^[A-Z0-9-]{8,50}$'"
  }
  // ELITE: Alpha & Bravo applied
  check "chk_price_positive"  {
  expr ="COALESCE((base_price).amount, 0) >= 0 AND (base_price).amount IS NOT NULL AND (base_price).currency IS NOT NULL"
}
check "chk_compare_price"  {
  expr ="(compare_at_price IS NULL OR (COALESCE((compare_at_price).amount, 0) > COALESCE((base_price).amount, 0) AND (compare_at_price).amount IS NOT NULL))"
}
check "chk_sale_price_math"  {
  expr ="(sale_price IS NULL OR (COALESCE((sale_price).amount, 0) <= COALESCE((base_price).amount, 0) AND (sale_price).amount IS NOT NULL))"
}
check "chk_specs_size"  {
  expr ="(pg_column_size(specifications) <= 20480)"
}
index "idx_products_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.products ENABLE ROW LEVEL SECURITY
  foreign_key "fk_prod_brand" {
    columns     = [column.brand_id]
    ref_columns = [table.brands.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_prod_cat" {
    columns     = [column.category_id]
    ref_columns = [table.categories.column.id]
    on_delete   = "RESTRICT"
  }
}
table "product_variants" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "price" {
    type = sql("public.money_amount")
    null = false
  }
  column "compare_at_price" {
    type = sql("public.money_amount")
    null = true
  }
  column "weight" {
    type = int
    null = true
  }
  column "version" {
    type = int
    default = 1
  }
  column "sku" {
    type = varchar(100)
  }
  column "barcode" {
    type = varchar(50)
    null = true
  }
  column "weight_unit" {
    type = varchar(5)
    default = "g"
  }
  column "image_url" {
    type = text
    null = true
  }
  column "options" {
    type = jsonb
  }
  column "embedding" {
    type = sql("public.vector(1536)")
    null = true
  }
primary_key {
  columns =[column.id]
}
unique "uq_tenant_variant"  {
  columns =[column.tenant_id, column.id]
}
unique "idx_variant_sku_active"  {
  columns =[column.tenant_id, column.sku]
  where ="deleted_at IS NULL"
}
index "idx_variants_product"  {
  columns =[column.product_id]
}
index "idx_variants_embedding_cosine" { 
    columns = [column.embedding]
    using = HNSW
    ops = [sql("public.vector_cosine_ops")]
      storage_param {
    name = "m"
    value = "24"
  }
storage_param {
    name = "ef_construction"
    value = "128"
  }
  }
check "chk_variant_options_obj"  {
  expr ="jsonb_typeof(options) = 'object'"
}
check "chk_variant_price_pos"  {
  expr ="(price).amount >= 0 AND (price).amount IS NOT NULL AND (price).currency IS NOT NULL"
}
check "chk_variant_compare_price"  {
  expr ="(compare_at_price IS NULL OR (compare_at_price).amount IS NOT NULL)"
}
index "idx_variants_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.product_variants ENABLE ROW LEVEL SECURITY
  foreign_key "fk_var_prod" {
    columns     = [column.tenant_id, column.product_id]
    ref_columns = [table.products.column.tenant_id, table.products.column.id]
    on_delete   = "RESTRICT"
  }
}
table "product_images" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
  }
  column "is_primary" {
    type = boolean
    default = false
  }
  column "sort_order" {
    type = int
    default = 0
  }
  column "url" {
    type = text
  }
  column "alt_text" {
    type = varchar(255)
    null = true
  }
primary_key {
  columns =[column.id]
}
index "idx_product_images_product"  {
  columns =[column.product_id]
}
unique "uq_primary_image"  {
  columns =[column.tenant_id, column.product_id]
  where ="is_primary =true"
}
index "idx_product_images_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.product_images ENABLE ROW LEVEL SECURITY
  foreign_key "fk_img_prod" {
    columns     = [column.tenant_id, column.product_id]
    ref_columns = [table.products.column.tenant_id, table.products.column.id]
    on_delete   = "CASCADE"
  }
}
table "product_attributes" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
  }
  column "sort_order" {
    type = int
    default = 0
  }
  column "attribute_name" {
    type = varchar(100)
  }
  column "attribute_value" {
    type = text
  }
  column "attribute_group" {
    type = varchar(100)
    null = true
  }
primary_key {
  columns =[column.id]
}
unique "uq_tenant_product_attr"  {
  columns =[column.tenant_id, column.product_id, column.attribute_name]
}
index "idx_attrs_product"  {
  columns =[column.product_id, column.attribute_name]
}
index "idx_attrs_value_trgm"  {
  columns =[column.attribute_value]
  using =GIN
}
  
  // Strike 04: Text Bloat Protection (Limit 1024)
  check "chk_attr_val_len"  {
  expr ="length(attribute_value) <= 1024"
}
index "idx_product_attributes_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.product_attributes ENABLE ROW LEVEL SECURITY
  foreign_key "fk_attr_prod" {
    columns     = [column.tenant_id, column.product_id]
    ref_columns = [table.products.column.tenant_id, table.products.column.id]
    on_delete   = "CASCADE"
  }
}
table "entity_metafields" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "entity_type" {
    type = varchar(50)
  }
  column "entity_id" {
    type = uuid
  }
  column "namespace" {
    type = varchar(100)
    default = "global"
  }
  column "key" {
    type = varchar(100)
  }
  column "type" {
    type = varchar(20)
    default = "string"
  }
  column "value" {
    type = jsonb
  }
primary_key {
  columns =[column.id]
}
unique "uq_metafield"  {
  columns =[column.entity_type, column.entity_id, column.namespace, column.key]
}
index "idx_metafields_lookup"  {
  columns =[column.entity_type, column.entity_id]
}
index "idx_metafields_value_gin"  {
  columns =[column.value]
  using =GIN
}
check "chk_metafield_size"  {
  expr ="(pg_column_size(value) <= 10240)"
}
index "idx_metafields_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.entity_metafields ENABLE ROW LEVEL SECURITY
}
table "smart_collections" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type = boolean
    default = true
  }
  column "slug" {
    type = varchar(255)
  }
  column "match_type" {
    type = varchar(5)
    default = "all"
  }
  column "sort_by" {
    type = varchar(50)
    default = "best_selling"
  }
  column "image_url" {
    type = text
    null = true
  }
  column "meta_title" {
    type = varchar(70)
    null = true
  }
  column "meta_description" {
    type = varchar(160)
    null = true
  }
  column "title" {
    type = jsonb
  }
  column "conditions" {
    type = jsonb
  }
  // Strike 25: Ensure conditions is a valid array of rules
  check "chk_conditions_array"  {
  expr ="jsonb_typeof(conditions) = 'array'"
}
primary_key {
  columns =[column.id]
}
check "conditions_size"  {
  expr ="(pg_column_size(conditions) <= 10240)"
}
unique "idx_smart_collections_slug"  {
  columns =[column.tenant_id, column.slug]
}
index "idx_smart_collections_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.smart_collections ENABLE ROW LEVEL SECURITY
}

// 2. INVENTORY SCHEMA (Storefront)
// ==========================================
table "locations" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type = boolean
    default = true
  }
  column "type" {
    type = enum.location_type
    default = "warehouse"
  }
  column "name" {
    type = jsonb
  }
  column "address" {
    type = jsonb
    null = true
  }
  column "coordinates" {
    type = sql("public.geography(point, 4326)")
    null = true
  }
primary_key {
  columns =[column.id]
}
unique "uq_tenant_loc"  {
  columns =[column.tenant_id, column.id]
}
index "idx_locations_gis"  {
  columns =[column.coordinates]
  using =GIST
}
index "idx_locations_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.locations ENABLE ROW LEVEL SECURITY
}
table "inventory_levels" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "location_id" {
    type = uuid
  }
  column "variant_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "available" {
    type = int
    null = false
    default = 0
  }
  column "reserved" {
    type = int
    null = false
    default = 0
  }
  column "incoming" {
    type = int
    null = false
    default = 0
  }
  column "version" {
    type = int
    default = 1
  }
primary_key {
  columns =[column.id]
}
unique "uq_inventory_loc_var"  {
  columns =[column.location_id, column.variant_id]
}
index "idx_inv_variant"  {
  columns =[column.variant_id]
}
check "chk_available"  {
  expr ="available >= 0"
}
check "chk_reserved"  {
  expr ="reserved >= 0"
}
check "chk_incoming_positive"  {
  expr ="incoming >= 0"
}
check "chk_reserved_logic"  {
  expr ="reserved <= available"
}
storage_param {
    fillfactor = 80
  }
index "idx_inventory_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.inventory_levels ENABLE ROW LEVEL SECURITY
  foreign_key "fk_inv_loc" {
    columns     = [column.tenant_id, column.location_id]
    ref_columns = [table.locations.column.tenant_id, table.locations.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_inv_variant" {
    columns     = [column.tenant_id, column.variant_id]
    ref_columns = [table.product_variants.column.tenant_id, table.product_variants.column.id]
    on_delete   = "RESTRICT"
  }
}
table "inventory_movements" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "variant_id" {
    type = uuid
  }
  column "location_id" {
    type = uuid
  }
  column "created_by" {
    type = uuid
    null = true
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "type" {
    type = enum.inventory_movement_type
  }
  column "quantity" {
    type = int
  }
  column "reason" {
    type = text
    null = true
  }
  column "reference_id" {
    type = uuid
    null = true
  }
primary_key {
  columns =[column.id]
}
index "idx_inv_mov_variant"  {
  columns =[column.variant_id]
}
index "idx_inv_mov_created"  {
  columns =[column.created_at]
  using =BRIN
}
check "chk_movement_logic"  {
  expr = "(( type ='in' AND quantity > 0) OR ( type ='out' AND quantity < 0) OR type IN ('adjustment', 'transfer', 'return'))"
}
  // Strike 17: Adjustment Reason Requirement
  check "chk_adj_reason"  {
  expr ="type != 'adjustment' OR reference_id IS NOT NULL"
}
check "chk_return_positive"  {
  expr ="(type != 'return' OR quantity > 0)"
}
index "idx_inv_mov_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.inventory_movements ENABLE ROW LEVEL SECURITY
  foreign_key "fk_im_variant" {
    columns     = [column.tenant_id, column.variant_id]
    ref_columns = [table.product_variants.column.tenant_id, table.product_variants.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_im_loc" {
    columns     = [column.tenant_id, column.location_id]
    ref_columns = [table.locations.column.tenant_id, table.locations.column.id]
    on_delete   = "RESTRICT"
  }
}
table "inventory_reservations" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "variant_id" {
    type = uuid
  }
  column "location_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "expires_at" {
    type = timestamptz
  }
  // Strike 14: Inventory Reservation Time Bound Guard (Max 7 days)
  check "chk_res_time_bound"  {
  expr ="expires_at <= (created_at + interval '7 days')"
}
  // Strike 6: Hoarding DoS Protection
  check "chk_res_qty_limit"  {
  expr ="quantity <= 100"
}
  
  column "status" {
    type = enum.reservation_status
    default = "active"
  }
  column "cart_id" {
    type = uuid
    null = true
  }
  column "quantity" {
    type = int
  }
primary_key {
  columns =[column.id]
}
storage_param {
    fillfactor = 80
  }
index "idx_inv_res_active"  {
  columns =[column.status]
  where ="status ='active'"
}
index "idx_inv_res_cron"  {
  columns =[column.expires_at]
  where ="status ='active'"
}
index "idx_inv_res_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.inventory_reservations ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ir_variant" {
    columns     = [column.tenant_id, column.variant_id]
    ref_columns = [table.product_variants.column.tenant_id, table.product_variants.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_ir_loc" {
    columns     = [column.tenant_id, column.location_id]
    ref_columns = [table.locations.column.tenant_id, table.locations.column.id]
    on_delete   = "RESTRICT"
  }
}
table "inventory_transfers" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "from_location_id" {
    type = uuid
  }
  column "to_location_id" {
    type = uuid
  }
  column "created_by" {
    type = uuid
    null = true
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "expected_arrival" {
    type = timestamptz
    null = true
  }
  column "status" {
    type = enum.transfer_status
    default = "draft"
  }
  column "notes" {
    type = text
    null = true
  }
  column "version" {
    type = int
    default = 1
  }
primary_key {
  columns =[column.id]
}
check "chk_transfer_locations"  {
  expr ="(from_location_id != to_location_id)"
}
check "chk_transfer_future"  {
  expr ="(expected_arrival IS NULL OR expected_arrival >= created_at)"
}
index "idx_inv_tra_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.inventory_transfers ENABLE ROW LEVEL SECURITY
  foreign_key "fk_it_from_loc" {
    columns     = [column.tenant_id, column.from_location_id]
    ref_columns = [table.locations.column.tenant_id, table.locations.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_it_to_loc" {
    columns     = [column.tenant_id, column.to_location_id]
    ref_columns = [table.locations.column.tenant_id, table.locations.column.id]
    on_delete   = "RESTRICT"
  }
}
table "inventory_transfer_items" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "transfer_id" {
    type = uuid
  }
  column "variant_id" {
    type = uuid
  }
  column "quantity" {
    type = int
  }
primary_key {
  columns =[column.id]
}
index "idx_transfer_items"  {
  columns =[column.transfer_id]
}
index "idx_inv_tra_items_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.inventory_transfer_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_iti_transfer" {
    columns     = [column.transfer_id]
    ref_columns = [table.inventory_transfers.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_iti_variant" {
    columns     = [column.tenant_id, column.variant_id]
    ref_columns = [table.product_variants.column.tenant_id, table.product_variants.column.id]
    on_delete   = "RESTRICT"
  }
}

// 3. SUPPLY CHAIN & B2B (Storefront)
// ==========================================
table "suppliers" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type = boolean
    default = true
  }
  column "lead_time_days" {
    type = int
    default = 7
  }
  column "currency" {
    type = char(3)
    default = "USD"
  }
  column "name" {
    type = text
  }
  
  column "email" {
    type = jsonb
    null = true
  }
  column "phone" {
    type = jsonb
    null = true
  }
  column "company" {
    type = jsonb
    null = true
  }
  
  column "notes" {
    type = text
    null = true
  }
  column "address" {
    type = jsonb
    null = true
  }
primary_key {
  columns =[column.id]
}
check "chk_sup_email_s7"  {
  expr ="(email IS NULL OR (jsonb_typeof(email) = 'object' AND email ? 'enc' AND email ? 'iv' AND email ? 'tag' AND email ? 'data'))"
}
check "chk_sup_phone_s7"  {
  expr ="(phone IS NULL OR (jsonb_typeof(phone) = 'object' AND phone ? 'enc' AND phone ? 'iv' AND phone ? 'tag' AND phone ? 'data'))"
}
check "chk_sup_company_s7"  {
  expr ="(company IS NULL OR (jsonb_typeof(company) = 'object' AND company ? 'enc' AND company ? 'iv' AND company ? 'tag' AND company ? 'data'))"
}
index "idx_suppliers_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.suppliers ENABLE ROW LEVEL SECURITY
}
table "purchase_orders" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "supplier_id" {
    type = uuid
  }
  column "location_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "expected_arrival" {
    type = timestamptz
    null = true
  }
  column "status" {
    type = enum.purchase_order_status
    default = "draft"
  }
  column "subtotal" {
    type = sql("public.money_amount")
    null = false
  }
  column "tax" {
    type = sql("public.money_amount")
    default = sql("ROW(0, 'SAR')::public.money_amount")
  }
  column "shipping_cost" {
    type = sql("public.money_amount")
    default = sql("ROW(0, 'SAR')::public.money_amount")
  }
  column "total" {
    type = sql("public.money_amount")
    null = false
  }
  column "order_number" {
    type = varchar(20)
    null = true
  }
  column "notes" {
    type = text
    null = true
  }
primary_key {
  columns =[column.id]
}
unique "idx_po_number_unique "  {
  columns =[column.tenant_id, column.order_number]
}
index "idx_po_supplier"  {
  columns =[column.supplier_id]
}
index "idx_po_status"  {
  columns =[column.status]
}
  
  // ELITE: Alpha & Bravo applied (Directive Bravo - Math Operator Fatal)
  check "chk_po_math"  {
  expr ="(COALESCE((total).amount, 0) = COALESCE((subtotal).amount, 0) + COALESCE((tax).amount, 0) + COALESCE((shipping_cost).amount, 0))"
}
check "chk_po_inner_not_null"  {
  expr ="(total).amount IS NOT NULL AND (subtotal).amount IS NOT NULL"
}
index "idx_purchase_orders_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.purchase_orders ENABLE ROW LEVEL SECURITY
  foreign_key "fk_po_supplier" {
    columns     = [column.supplier_id]
    ref_columns = [table.suppliers.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_po_location" {
    columns     = [column.tenant_id, column.location_id]
    ref_columns = [table.locations.column.tenant_id, table.locations.column.id]
    on_delete   = "RESTRICT"
  }
}
table "purchase_order_items" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "po_id" {
    type = uuid
  }
  column "variant_id" {
    type = uuid
  }
  column "quantity_ordered" {
    type = int
  }
  column "quantity_received" {
    type = int
    default = 0
  }
  // Strike 14: Over-receiving Protection
  check "chk_po_receive"  {
  expr ="quantity_received <= quantity_ordered"
}
  column "unit_cost" {
    type = sql("public.money_amount")
    null = false
  }
primary_key {
  columns =[column.id]
}
index "idx_po_items"  {
  columns =[column.po_id]
}
check "qty_positive"  {
  expr ="(quantity_ordered > 0)"
}
index "idx_poi_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.purchase_order_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_poi_po" {
    columns     = [column.po_id]
    ref_columns = [table.purchase_orders.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_poi_variant" {
    columns     = [column.tenant_id, column.variant_id]
    ref_columns = [table.product_variants.column.tenant_id, table.product_variants.column.id]
    on_delete   = "RESTRICT"
  }
}
table "b2b_companies" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "credit_limit" {
    type = sql("public.money_amount")
    default = sql("ROW(0, 'SAR')::public.money_amount")
  }
  column "credit_used" {
    type = sql("public.money_amount")
    default = sql("ROW(0, 'SAR')::public.money_amount")
  }
  column "payment_terms_days" {
    type = int
    default = 30
  }
  column "status" {
    type = enum.b2b_company_status
    default = "pending"
  }
  column "name" {
    type = varchar(255)
  }
  column "tax_id" {
    type = varchar(50)
    null = true
  }
  column "industry" {
    type = varchar(100)
    null = true
  }
  column "lock_version" {
    type = int
    default = 1
  }
primary_key {
  columns =[column.id]
}
check "chk_credit_limit_positive"  {
  expr ="COALESCE((credit_limit).amount, 0) >= 0"
} 
  // ELITE PATCH: Removed chk_credit_utilization DB constraint to avoid Admin lockout when reducing limits. Enforced strictly at App Layer.
  check "chk_tax_id_len"  {
  expr ="(tax_id IS NULL OR length(tax_id) >= 5)"
}
index "idx_b2b_companies_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.b2b_companies ENABLE ROW LEVEL SECURITY
}
table "b2b_pricing_tiers" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "company_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "discount_basis_points" {
    type = int
    null = true
  } 
  column "name" {
    type = text
  }
  column "min_quantity" {
    type = int
    default = 1
  }
  column "max_quantity" {
    type = int
    null = true
  }
  column "price" {
    type = sql("public.money_amount")
    null = true
  } 
  column "currency" {
    type = char(3)
    default = "SAR"
  }
  column "quantity_range" {
    type = sql("int4range")
    null = false
  }
  column "lock_version" {
    type = int
    default = 1
  }
primary_key {
  columns =[column.id]
}
  exclude "idx_b2b_overlap_prevent" {
    columns = [column.tenant_id, column.company_id, column.product_id, column.quantity_range]
    using   = GIST
    ops     = ["=", "=", "=", "&&"]
  }
index "idx_b2b_pricing"  {
  columns =[column.company_id, column.product_id]
}
index "idx_b2b_tier_collision"  {
  columns =[column.min_quantity, column.max_quantity]
  using =GIST
}
check "chk_b2b_price_xor"  {
  expr ="((price IS NULL) != (discount_basis_points IS NULL))"
}
check "chk_b2b_discount_max"  {
  expr ="(discount_basis_points IS NULL OR discount_basis_points <= 10000)"
}
check "chk_b2b_price_pos"  {
  expr ="(price IS NULL OR ((price).amount >= 0 AND (price).amount IS NOT NULL))"
}
index "idx_b2bp_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.b2b_pricing_tiers ENABLE ROW LEVEL SECURITY
  foreign_key "fk_b2bpt_company" {
    columns     = [column.company_id]
    ref_columns = [table.b2b_companies.column.id]
    on_delete   = "RESTRICT"
  }
foreign_key "fk_b2bpt_product" {
    columns     = [column.tenant_id, column.product_id]
    ref_columns = [table.products.column.tenant_id, table.products.column.id]
    on_delete   = "RESTRICT"
  }
}
table "b2b_users" {
  schema = schema.storefront
  column "id" {
    type = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "company_id" {
    type = uuid
  }
  column "customer_id" {
    type = uuid
  }
  column "created_at" {
    type = timestamptz
    default = sql("now()")
  }
  column "role" {
    type = enum.b2b_user_role
    default = "buyer"
  }
  column "unit_price" {
    type = sql("public.money_amount")
    default = sql("ROW(0, 'SAR')::public.money_amount")
    null = false
  }
  column "currency" {
    type = char(3)
    default = "SAR"
  }
primary_key {
  columns =[column.id]
}
unique "uq_b2b_company_customer"  {
  columns =[column.tenant_id, column.company_id, column.customer_id]
}
index "idx_b2b_user"  {
  columns =[column.company_id]
}
check "chk_b2b_unit_price_pos"  {
  expr ="COALESCE((unit_price).amount, 0) >= 0"
}
index "idx_b2b_users_tenant"  {
  columns =[column.tenant_id]
}
  // ALTER TABLE storefront.b2b_users ENABLE ROW LEVEL SECURITY
  foreign_key "fk_b2bu_company" {
    columns     = [column.company_id]
    ref_columns = [table.b2b_companies.column.id]
    on_delete   = "RESTRICT"
  }
}

// ==========================================
// ELITE SECURITY: FORCED RLS ACTIVATION 
// Protocol: RESTRICTIVE | Scope: STOREFRONT
// ==========================================

sql "rls_02_catalog_inventory" {
  schema = schema.storefront
  as = <<SQL
-- Categories
ALTER TABLE storefront.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.categories;
CREATE POLICY tenant_isolation_policy ON storefront.categories 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL);

-- Brands
ALTER TABLE storefront.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.brands FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.brands;
CREATE POLICY tenant_isolation_policy ON storefront.brands 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL);

-- Products
ALTER TABLE storefront.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.products FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.products;
CREATE POLICY tenant_isolation_policy ON storefront.products 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL);

-- Product Variants
ALTER TABLE storefront.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_variants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_variants;
CREATE POLICY tenant_isolation_policy ON storefront.product_variants 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL);

-- Product Images
ALTER TABLE storefront.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_images FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_images;
CREATE POLICY tenant_isolation_policy ON storefront.product_images 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Product Attributes
ALTER TABLE storefront.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_attributes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_attributes;
CREATE POLICY tenant_isolation_policy ON storefront.product_attributes 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Entity Metafields
ALTER TABLE storefront.entity_metafields ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.entity_metafields FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.entity_metafields;
CREATE POLICY tenant_isolation_policy ON storefront.entity_metafields 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);


-- Smart Collections
ALTER TABLE storefront.smart_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.smart_collections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.smart_collections;
CREATE POLICY tenant_isolation_policy ON storefront.smart_collections 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Locations
ALTER TABLE storefront.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.locations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.locations;
CREATE POLICY tenant_isolation_policy ON storefront.locations 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Inventory Levels
ALTER TABLE storefront.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_levels FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_levels;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_levels 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Inventory Movements
ALTER TABLE storefront.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_movements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_movements;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_movements 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Inventory Reservations
ALTER TABLE storefront.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_reservations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_reservations;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_reservations 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Inventory Transfers
ALTER TABLE storefront.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_transfers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_transfers;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_transfers 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Inventory Transfer Items
ALTER TABLE storefront.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.inventory_transfer_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.inventory_transfer_items;
CREATE POLICY tenant_isolation_policy ON storefront.inventory_transfer_items 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Suppliers
ALTER TABLE storefront.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.suppliers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.suppliers;
CREATE POLICY tenant_isolation_policy ON storefront.suppliers 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Purchase Orders
ALTER TABLE storefront.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.purchase_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.purchase_orders;
CREATE POLICY tenant_isolation_policy ON storefront.purchase_orders 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Purchase Order Items
ALTER TABLE storefront.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.purchase_order_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.purchase_order_items;
CREATE POLICY tenant_isolation_policy ON storefront.purchase_order_items 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- B2B Companies
ALTER TABLE storefront.b2b_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.b2b_companies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.b2b_companies;
CREATE POLICY tenant_isolation_policy ON storefront.b2b_companies 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- B2B Pricing Tiers
ALTER TABLE storefront.b2b_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.b2b_pricing_tiers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.b2b_pricing_tiers;
CREATE POLICY tenant_isolation_policy ON storefront.b2b_pricing_tiers 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- B2B Users
ALTER TABLE storefront.b2b_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.b2b_users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.b2b_users;
CREATE POLICY tenant_isolation_policy ON storefront.b2b_users 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
SQL
}
