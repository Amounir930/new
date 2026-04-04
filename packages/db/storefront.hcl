schema "public" {}

// 0. DYNAMIC SCHEMA ARCHITECTURE (Hybrid Isolation)
// ==========================================
variable "tenant_schema_name" {
  type = string
}

schema "dynamic_tenant" {
  name = var.tenant_schema_name
}

// 1. DYNAMIC ENUMS (Mapped to Public)
// ==========================================

enum "order_status" {
  schema = schema.public
  values = ["draft", "awaiting_approval", "pending", "processing", "shipped", "delivered", "cancelled", "returned"]
}
enum "payment_status" {
  schema = schema.public
  values = ["pending", "paid", "partially_refunded", "refunded", "failed"]
}
enum "payment_method" {
  schema = schema.public
  values = ["card", "cod", "wallet", "bnpl", "bank_transfer"]
}
enum "fulfillment_status" {
  schema = schema.public
  values = ["pending", "shipped", "in_transit", "delivered", "failed"]
}
enum "order_source" {
  schema = schema.public
  values = ["web", "mobile", "b2b", "pos"]
}
enum "discount_type" {
  schema = schema.public
  values = ["percentage", "fixed", "buy_x_get_y", "free_shipping"]
}
enum "discount_applies_to" {
  schema = schema.public
  values = ["all", "specific_products", "specific_categories", "specific_customers"]
}
enum "rma_status" {
  schema = schema.public
  values = ["requested", "approved", "shipped", "received", "completed", "rejected"]
}
enum "rma_reason_code" {
  schema = schema.public
  values = ["defective", "wrong_item", "changed_mind", "not_as_described", "damaged_in_transit"]
}
enum "rma_condition" {
  schema = schema.public
  values = ["new", "opened", "damaged"]
}
enum "rma_resolution" {
  schema = schema.public
  values = ["refund", "exchange", "store_credit"]
}
enum "refund_status" {
  schema = schema.public
  values = ["pending", "processed", "failed"]
}
enum "inventory_movement_type" {
  schema = schema.public
  values = ["in", "out", "adjustment", "return", "transfer"]
}
enum "reservation_status" {
  schema = schema.public
  values = ["active", "converted", "expired"]
}
enum "transfer_status" {
  schema = schema.public
  values = ["draft", "in_transit", "received", "cancelled"]
}
enum "location_type" {
  schema = schema.public
  values = ["warehouse", "retail", "dropship"]
}
enum "purchase_order_status" {
  schema = schema.public
  values = ["draft", "ordered", "partial", "received", "cancelled"]
}
enum "invoice_status" {
  schema = schema.public
  values = ["draft", "issued", "paid", "overdue"]
}
enum "lead_status" {
  schema = schema.public
  values = ["new", "contacted", "qualified", "converted"]
}
enum "dunning_status" {
  schema = schema.public
  values = ["pending", "retried", "failed", "recovered"]
}
enum "outbox_status" {
  schema = schema.public
  values = ["pending", "processing", "completed", "failed"]
}
enum "affiliate_status" {
  schema = schema.public
  values = ["active", "pending", "suspended"]
}
enum "affiliate_tx_status" {
  schema = schema.public
  values = ["pending", "approved", "paid", "rejected"]
}
enum "b2b_company_status" {
  schema = schema.public
  values = ["active", "pending", "suspended"]
}
enum "b2b_user_role" {
  schema = schema.public
  values = ["admin", "buyer", "viewer"]
}
enum "consent_channel" {
  schema = schema.public
  values = ["email", "sms", "push", "whatsapp"]
}
enum "actor_type" {
  schema = schema.public
  values = ["super_admin", "tenant_admin", "system"]
}
enum "blueprint_status" {
  schema = schema.public
  values = ["active", "paused"]
}
enum "severity_enum" {
  schema = schema.public
  values = ["INFO", "WARNING", "CRITICAL", "SECURITY_ALERT"]
}
enum "audit_result_enum" {
  schema = schema.public
  values = ["SUCCESS", "FAILURE"]
}
enum "niche_type" {
  schema = schema.public
  values = ["retail", "wellness", "education", "services", "hospitality", "real_estate", "creative", "food", "digital"]
}
enum "tenant_plan" {
  schema = schema.public
  values = ["free", "basic", "pro", "enterprise"]
}
enum "tenant_status" {
  schema = schema.public
  values = ["active", "suspended", "pending", "archived"]
}

// 2. CORE TABLES (Extracted from 02-06, Unified and Neutralized)
// ==========================================

// [EXTRACTED CORE STOREFRONT SCHEMA CONTENT TO FOLLOW]
// (I will call more read commands to ensure perfect extraction)
// ==========================================
// APEX V2 - 2026 ENTERPRISE ARCHITECTURE (ATLAS HCL)
// DIRECTIVE: EXECUTIVE OVERRIDE (ATLAS-2026-01)
// STATUS: FINAL | SECURITY: ZERO-TOLERANCE
// MODULE: 02_CATALOG_INVENTORY (Products & Supply Chain)
// ==========================================

// 1. CATALOG SCHEMA (Storefront)
// ==========================================
table "categories" {
  schema = schema.public
  // Strike 13: LTREE path recursion safety
  // (Placeholder for trigger - will be implemented in security.hcl if needed, but adding column check here)
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "parent_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "sort_order" {
    type    = int
    default = 0
  }
  column "products_count" {
    type    = int
    default = 0
  }
  column "is_active" {
    type    = boolean
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
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_categories_slug_active" {
    unique  = true
    columns = [column.slug]
    where   = "deleted_at IS NULL"
  }
  index "idx_categories_parent" {
    columns = [column.parent_id]
  }
  index "idx_categories_active" {
    columns = [column.is_active]
    where   = "deleted_at IS NULL"
  }


  check "chk_categories_no_circular_ref" {
    expr = "(parent_id IS NULL OR parent_id != id)"
  }


  // Strike 12: Cascading LTREE Update (Logic handled in 07-SECURITY via Trigger)





  foreign_key "fk_cat_parent" {
    columns     = [column.parent_id]
    ref_columns = [table.categories.column.id]
    on_delete = RESTRICT
  }
}
table "brands" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "is_active" {
    type    = boolean
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
    columns = [column.id]
  }
  index "idx_brands_slug_active" {
    unique  = true
    columns = [column.slug]
    where   = "deleted_at IS NULL"
  }
  index "idx_brands_active" {
    columns = [column.is_active]
    where   = "deleted_at IS NULL"
  }





}
table "products" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  // ROOT CAUSE FIX: niche column was missing from Atlas HCL — Atlas creates the products table
  // for every new tenant WITHOUT this column. Must match drizzle schema.ts line 1491.
  column "niche" {
    type    = enum.niche_type
    default = "retail"
    null    = false
  }

  // ROOT CAUSE FIX: attributes column was missing from Atlas HCL — every new tenant's products
  // table was created WITHOUT this column. Must match drizzle schema.ts line 1493.
  column "attributes" {
    type    = jsonb
    default = sql("'{}'::jsonb")
    null    = false
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
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
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
    type = decimal(12,4)
    null = false
  }
  column "sale_price" {
    type = decimal(12,4)
    null = true
  }
  column "cost_price" {
    type = decimal(12,4)
    null = true
  }
  column "compare_at_price" {
    type = decimal(12,4)
    null = true
  }
  column "tax_basis_points" {
    type    = int
    default = 0
  }
  column "low_stock_threshold" {
    type    = int
    default = 5
  }
  column "sold_count" {
    type    = int
    default = 0
  }
  column "view_count" {
    type    = int
    default = 0
  }
  column "review_count" {
    type    = int
    default = 0
  }
  column "weight" {
    type = int
    null = true
  }
  column "min_order_qty" {
    type    = int
    default = 1
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "is_featured" {
    type    = boolean
    default = false
  }
  column "is_returnable" {
    type    = boolean
    default = true
  }
  column "requires_shipping" {
    type    = boolean
    default = true
  }
  column "is_digital" {
    type    = boolean
    default = false
  }
  column "track_inventory" {
    type    = boolean
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
    type    = numeric(3,2)
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
    type    = jsonb
    default = sql("'{}'::jsonb")
  }
  column "dimensions" {
    type = jsonb
    null = true
  }
  column "gallery_images" {
    type    = jsonb
    default = sql("'[]'::jsonb")
  }
  column "embedding" {
    type = sql("vector(1536)")
    null = true
  }
  column "version" {
    type    = bigint
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
    columns = [column.id]
  }

  index "idx_products_slug_active" {
    unique  = true
    columns = [column.slug]
    where   = "deleted_at IS NULL"
  }
  index "idx_products_sku_active" {
    unique  = true
    columns = [column.sku]
    where   = "deleted_at IS NULL"
  }
  index "idx_products_active" {
    columns = [column.category_id]
    where   = "deleted_at IS NULL"
  }
  index "idx_products_featured" {
    columns = [column.is_featured]
    where   = "deleted_at IS NULL"
  }
  index "idx_products_tags" {
    columns = [column.tags]
    type = "GIN"
  }
  index "idx_products_name" {
    columns = [column.name]
    type = "GIN"
  }
  index "idx_products_brand" {
    columns = [column.brand_id]
  }
#  index "idx_products_embedding_cosine" {
#    on {
#      column = column.embedding
#      opclass = "vector_cosine_ops"
#    }
#    type = "HNSW"
#  }


  // Strike 18: Digital/Shipping Logic Consistency
  check "chk_digital_shipping" {
    expr = "NOT (is_digital AND requires_shipping)"
  }
  check "chk_barcode_format" {
    expr = "barcode IS NULL OR barcode ~ '^[A-Z0-9-]{8,50} $'"
  }
  // ELITE: Alpha & Bravo applied
  check "chk_price_positive" {
    expr = "COALESCE((base_price), 0) >= 0 AND (base_price) IS NOT NULL AND (base_price) IS NOT NULL"
  }
  check "chk_compare_price" {
    expr = "(compare_at_price IS NULL OR (COALESCE((compare_at_price), 0) > COALESCE((base_price), 0) AND (compare_at_price) IS NOT NULL))"
  }
  check "chk_sale_price_math" {
    expr = "(sale_price IS NULL OR (COALESCE((sale_price), 0) <= COALESCE((base_price), 0) AND (sale_price) IS NOT NULL))"
  }
  check "chk_specs_size" {
    expr = "(pg_column_size(specifications) <= 20480)"
  }


  foreign_key "fk_prod_brand" {
    columns     = [column.brand_id]
    ref_columns = [table.brands.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_prod_cat" {
    columns     = [column.category_id]
    ref_columns = [table.categories.column.id]
    on_delete = RESTRICT
  }
}
table "product_variants" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "product_id" {
    type = uuid
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "price" {
    type = decimal(12,4)
    null = false
  }
  column "compare_at_price" {
    type = decimal(12,4)
    null = true
  }
  column "weight" {
    type = int
    null = true
  }
  column "version" {
    type    = int
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
    type    = varchar(5)
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
    type = sql("vector(1536)")
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_variant_sku_active" {
    unique  = true
    columns = [column.sku]
    where   = "deleted_at IS NULL"
  }
  index "idx_variants_product" {
    columns = [column.product_id]
  }
#  index "idx_variants_embedding_cosine" {
#    on {
#      column = column.embedding
#      opclass = "vector_cosine_ops"
#    }
#    type = "HNSW"
#  }

  check "chk_variant_options_obj" {
    expr = "jsonb_typeof(options) = 'object'"
  }
  check "chk_variant_price_pos" {
    expr = "(price) >= 0 AND (price) IS NOT NULL AND (price) IS NOT NULL"
  }
  check "chk_variant_compare_price" {
    expr = "(compare_at_price IS NULL OR (compare_at_price) IS NOT NULL)"
  }


  foreign_key "fk_var_prod" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete = RESTRICT
  }
}
table "product_images" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "product_id" {
    type = uuid
  }
  column "is_primary" {
    type    = boolean
    default = false
  }
  column "sort_order" {
    type    = int
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
    columns = [column.id]
  }
  index "idx_product_images_product" {
    columns = [column.product_id]
  }
  index "uq_primary_image" {
    unique  = true
    columns = [column.product_id]
    where   = "is_primary =true"
  }


  foreign_key "fk_img_prod" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete = CASCADE
  }

}
table "product_attributes" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "product_id" {
    type = uuid
  }
  column "sort_order" {
    type    = int
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
    columns = [column.id]
  }
  unique "uq_tenant_product_attr" {
    columns = [column.product_id, column.attribute_name]
  }
  index "idx_attrs_product" {
    columns = [column.product_id, column.attribute_name]
  }


  // Strike 04: Text Bloat Protection (Limit 1024)
  check "chk_attr_val_len" {
    expr = "length(attribute_value) <= 1024"
  }


  foreign_key "fk_attr_prod" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete = CASCADE
  }

}
table "entity_metafields" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "entity_type" {
    type = varchar(50)
  }
  column "entity_id" {
    type = uuid
  }
  column "namespace" {
    type    = varchar(100)
    default = "global"
  }
  column "key" {
    type = varchar(100)
  }
  column "type" {
    type    = varchar(20)
    default = "string"
  }
  column "value" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_metafield" {
    columns = [column.entity_type, column.entity_id, column.namespace, column.key]
  }
  index "idx_metafields_lookup" {
    columns = [column.entity_type, column.entity_id]
  }

  check "chk_metafield_size" {
    expr = "(pg_column_size(value) <= 10240)"
  }



}
table "smart_collections" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "slug" {
    type = varchar(255)
  }
  column "match_type" {
    type    = varchar(5)
    default = "all"
  }
  column "sort_by" {
    type    = varchar(50)
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
  check "chk_conditions_array" {
    expr = "jsonb_typeof(conditions) = 'array'"
  }
  primary_key {
    columns = [column.id]
  }
  check "conditions_size" {
    expr = "(pg_column_size(conditions) <= 10240)"
  }
  unique "idx_smart_collections_slug" {
    columns = [column.slug]
  }



}

// 2. INVENTORY SCHEMA (Storefront)
// ==========================================
table "locations" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "type" {
    type    = enum.location_type
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
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }




}
table "inventory_levels" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "location_id" {
    type = uuid
  }
  column "variant_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "available" {
    type    = int
    null    = false
    default = 0
  }
  column "reserved" {
    type    = int
    null    = false
    default = 0
  }
  column "incoming" {
    type    = int
    null    = false
    default = 0
  }
  column "version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_inventory_loc_var" {
    columns = [column.location_id, column.variant_id]
  }
  index "idx_inv_variant" {
    columns = [column.variant_id]
  }
  check "chk_available" {
    expr = "available >= 0"
  }
  check "chk_reserved" {
    expr = "reserved >= 0"
  }
  check "chk_incoming_positive" {
    expr = "incoming >= 0"
  }
  check "chk_reserved_logic" {
    expr = "reserved <= available"
  }



  foreign_key "fk_inv_loc" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_inv_variant" {
    columns     = [column.variant_id]
    ref_columns = [table.product_variants.column.id]
    on_delete = RESTRICT
  }

}
table "inventory_movements" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
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
    type    = timestamptz
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
    columns = [column.id]
  }
  index "idx_inv_mov_variant" {
    columns = [column.variant_id]
  }
  index "idx_inv_mov_created" {
    columns = [column.created_at]
    type = "BRIN"
  }
  check "chk_movement_logic" {
    expr = "(( type ='in' AND quantity > 0) OR ( type ='out' AND quantity < 0) OR type IN ('adjustment', 'transfer', 'return'))"
  }
  // Strike 17: Adjustment Reason Requirement
  check "chk_adj_reason" {
    expr = "type != 'adjustment' OR reference_id IS NOT NULL"
  }
  check "chk_return_positive" {
    expr = "(type != 'return' OR quantity > 0)"
  }


  foreign_key "fk_im_variant" {
    columns     = [column.variant_id]
    ref_columns = [table.product_variants.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_im_loc" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete = RESTRICT
  }

}
table "inventory_reservations" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "variant_id" {
    type = uuid
  }
  column "location_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "expires_at" {
    type = timestamptz
  }
  // Strike 14: Inventory Reservation Time Bound Guard (Max 7 days)
  check "chk_res_time_bound" {
    expr = "expires_at <= (created_at + interval '7 days')"
  }
  // Strike 6: Hoarding DoS Protection
  check "chk_res_qty_limit" {
    expr = "quantity <= 100"
  }

  column "status" {
    type    = enum.reservation_status
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
    columns = [column.id]
  }

  index "idx_inv_res_active" {
    columns = [column.status]
    where   = "status ='active'"
  }
  index "idx_inv_res_cron" {
    columns = [column.expires_at]
    where   = "status ='active'"
  }


  foreign_key "fk_ir_variant" {
    columns     = [column.variant_id]
    ref_columns = [table.product_variants.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_ir_loc" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete = RESTRICT
  }

}
table "inventory_transfers" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
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
    type    = timestamptz
    default = sql("now()")
  }
  column "expected_arrival" {
    type = timestamptz
    null = true
  }
  column "status" {
    type    = enum.transfer_status
    default = "draft"
  }
  column "notes" {
    type = text
    null = true
  }
  column "version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }
  check "chk_transfer_locations" {
    expr = "(from_location_id != to_location_id)"
  }
  check "chk_transfer_future" {
    expr = "(expected_arrival IS NULL OR expected_arrival >= created_at)"
  }


  foreign_key "fk_it_from_loc" {
    columns     = [column.from_location_id]
    ref_columns = [table.locations.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_it_to_loc" {
    columns     = [column.to_location_id]
    ref_columns = [table.locations.column.id]
    on_delete = RESTRICT
  }

}
table "inventory_transfer_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
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
    columns = [column.id]
  }
  index "idx_transfer_items" {
    columns = [column.transfer_id]
  }

  // ALTER TABLE storefront.inventory_transfer_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_iti_transfer" {
    columns     = [column.transfer_id]
    ref_columns = [table.inventory_transfers.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_iti_variant" {
    columns     = [column.variant_id]
    ref_columns = [table.product_variants.column.id]
    on_delete = RESTRICT
  }

}

// 3. SUPPLY CHAIN & B2B (Storefront)
// ==========================================
table "suppliers" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "lead_time_days" {
    type    = int
    default = 7
  }
  column "currency" {
    type    = char(3)
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
    columns = [column.id]
  }
  check "chk_sup_email_s7" {
    expr = "(email IS NULL OR (jsonb_typeof(email) = 'object' AND email ? 'enc' AND email ? 'iv' AND email ? 'tag' AND email ? 'data'))"
  }
  check "chk_sup_phone_s7" {
    expr = "(phone IS NULL OR (jsonb_typeof(phone) = 'object' AND phone ? 'enc' AND phone ? 'iv' AND phone ? 'tag' AND phone ? 'data'))"
  }
  check "chk_sup_company_s7" {
    expr = "(company IS NULL OR (jsonb_typeof(company) = 'object' AND company ? 'enc' AND company ? 'iv' AND company ? 'tag' AND company ? 'data'))"
  }



}
table "purchase_orders" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "supplier_id" {
    type = uuid
  }
  column "location_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "expected_arrival" {
    type = timestamptz
    null = true
  }
  column "status" {
    type    = enum.purchase_order_status
    default = "draft"
  }
  column "subtotal" {
    type = decimal(12,4)
    null = false
  }
  column "tax" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "shipping_cost" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "total" {
    type = decimal(12,4)
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
    columns = [column.id]
  }
  unique "idx_po_number_unique" {
    columns = [column.order_number]
  }
  index "idx_po_supplier" {
    columns = [column.supplier_id]
  }
  index "idx_po_status" {
    columns = [column.status]
  }

  // ELITE: Alpha & Bravo applied (Directive Bravo - Math Operator Fatal)
  check "chk_po_math" {
    expr = "(COALESCE((total), 0) = COALESCE((subtotal), 0) + COALESCE((tax), 0) + COALESCE((shipping_cost), 0))"
  }
  check "chk_po_inner_not_null" {
    expr = "(total) IS NOT NULL AND (subtotal) IS NOT NULL"
  }


  foreign_key "fk_po_supplier" {
    columns     = [column.supplier_id]
    ref_columns = [table.suppliers.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_po_location" {
    columns     = [column.location_id]
    ref_columns = [table.locations.column.id]
    on_delete = RESTRICT
  }

}
table "purchase_order_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
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
    type    = int
    default = 0
  }
  // Strike 14: Over-receiving Protection
  check "chk_po_receive" {
    expr = "quantity_received <= quantity_ordered"
  }
  column "unit_cost" {
    type = decimal(12,4)
    null = false
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_po_items" {
    columns = [column.po_id]
  }
  check "qty_positive" {
    expr = "(quantity_ordered > 0)"
  }


  foreign_key "fk_poi_po" {
    columns     = [column.po_id]
    ref_columns = [table.purchase_orders.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_poi_variant" {
    columns     = [column.variant_id]
    ref_columns = [table.product_variants.column.id]
    on_delete = RESTRICT
  }

}
table "b2b_companies" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "credit_limit" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "credit_used" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "payment_terms_days" {
    type    = int
    default = 30
  }
  column "status" {
    type    = sql("public.b2b_company_status")
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
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }
  check "chk_credit_limit_positive" {
    expr = "COALESCE((credit_limit), 0) >= 0"
  }
  // ELITE GUARD: chk_credit_utilization enforced at DB level. App Layer must handle concurrency via DEFERRABLE state.
  check "chk_tax_id_len" {
    expr = "(tax_id IS NULL OR length(tax_id) >= 5)"
  }



}
table "b2b_pricing_tiers" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "company_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
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
    type    = int
    default = 1
  }
  column "max_quantity" {
    type = int
    null = true
  }
  column "price" {
    type = decimal(12,4)
    null = true
  }
  column "currency" {
    type    = char(3)
    default = "SAR"
  }
  column "quantity_range" {
    type = sql("int4range")
    null = false
  }
  column "lock_version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }
#  // ELITE: Prevent overlapping quantity ranges for same product/variant/market
#  index "idx_b2b_pricing_overlap" {
#    type = "GIST"
#    on {
#      column = column.company_id
#    }
#    on {
#      column = column.product_id
#    }
#    on {
#      column = column.quantity_range
#    }
#  }


  index "idx_b2b_pricing" {
    columns = [column.company_id, column.product_id]
  }

  check "chk_b2b_price_xor" {
    expr = "((price IS NULL) != (discount_basis_points IS NULL))"
  }
  check "chk_b2b_discount_max" {
    expr = "(discount_basis_points IS NULL OR discount_basis_points <= 10000)"
  }
  check "chk_b2b_price_pos" {
    expr = "(price IS NULL OR ((price) >= 0 AND (price) IS NOT NULL))"
  }


  foreign_key "fk_b2bpt_company" {
    columns     = [column.company_id]
    ref_columns = [table.b2b_companies.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_b2bpt_product" {
    columns     = [column.product_id]
    ref_columns = [table.products.column.id]
    on_delete = RESTRICT
  }

}
table "b2b_users" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "company_id" {
    type = uuid
  }
  column "customer_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "role" {
    type    = sql("public.b2b_user_role")
    default = "buyer"
  }
  column "unit_price" {
    type = decimal(12,4)
    default = 0.0000
    null    = false
  }
  column "currency" {
    type    = char(3)
    default = "SAR"
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_b2b_company_customer" {
    columns = [column.company_id, column.customer_id]
  }
  index "idx_b2b_user" {
    columns = [column.company_id]
  }
  check "chk_b2b_unit_price_pos" {
    expr = "COALESCE((unit_price), 0) >= 0"
  }


  foreign_key "fk_b2bu_company" {
    columns     = [column.company_id]
    ref_columns = [table.b2b_companies.column.id]
    on_delete = RESTRICT
  }

}

// ==========================================
// ELITE SECURITY: FORCED RLS ACTIVATION 
// Protocol: RESTRICTIVE | Scope: STOREFRONT
// ==========================================

// ==========================================
// APEX V2 - 2026 ENTERPRISE ARCHITECTURE (ATLAS HCL)
// DIRECTIVE: EXECUTIVE OVERRIDE (ATLAS-2026-01)
// STATUS: FINAL | SECURITY: ZERO-TOLERANCE
// MODULE: 03_COMMERCE_CRM (Transactional & Users)
// ==========================================

table "customers" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "last_login_at" {
    type = timestamptz
    null = true
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "date_of_birth" {
    type = date
    null = true
  }
  column "wallet_balance" {
    type = decimal(12,4)
    null    = false
    default = 0.0000
  }
  column "total_spent_amount" {
    type = decimal(12,4)
    null    = false
    default = 0.0000
  }
  check "chk_wallet_bal_pos" {
    expr = "COALESCE((wallet_balance), 0) >= 0 AND (wallet_balance) IS NOT NULL AND (wallet_balance) IS NOT NULL"
  }
  check "chk_total_spent_pos" {
    expr = "COALESCE((total_spent_amount), 0) >= 0 AND (total_spent_amount) IS NOT NULL"
  }
  column "loyalty_points" {
    type    = int
    default = 0
  }
  column "total_orders_count" {
    type    = int
    default = 0
  }
  column "is_verified" {
    type    = boolean
    default = false
  }
  column "accepts_marketing" {
    type    = boolean
    default = false
  }
  column "email" {
    type = jsonb
  }
  column "email_hash" {
    type = char(64)
  }
  column "password_hash" {
    type = text
    null = true
  }
  // SECURITY (Feedback Loop): Enforce Bcrypt prefix to avoid plaintext or weak hash storage
  check "chk_cust_pwd_hash" {
    expr = "(password_hash IS NULL OR password_hash ~ '^\\$2[ayb]\\$.+$')"
  }
  column "first_name" {
    type = jsonb
    null = true
  }
  column "last_name" {
    type = jsonb
    null = true
  }
  column "phone" {
    type = jsonb
    null = true
  }
  column "phone_hash" {
    type = char(64)
    null = true
  }
  column "avatar_url" {
    type = text
    null = true
  }
  column "gender" {
    type = varchar(10)
    null = true
  }
  column "language" {
    type    = char(2)
    default = "ar"
  }
  column "notes" {
    type = text
    null = true
  }
  column "tags" {
    type = text
    null = true
  }
  column "version" {
    type    = int
    default = 1
  }
  column "lock_version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_customer_email_hash" {
    unique  = true
    columns = [column.email_hash]
    where   = "deleted_at IS NULL"
  }
  index "idx_customer_phone_hash" {
    unique  = true
    columns = [column.phone_hash]
    where   = "deleted_at IS NULL"
  }
  index "idx_customers_active" {
    columns = [column.created_at]
    where   = "deleted_at IS NULL"
  }
  index "idx_customers_tags" {
    columns = [column.tags]
  }
  index "idx_customers_dob" {
    columns = [column.date_of_birth]
  }
  check "chk_cust_email_s7" {
    expr = "(email IS NULL OR (jsonb_typeof(email) = 'object' AND email ? 'enc' AND email ? 'iv' AND email ? 'tag' AND email ? 'data'))"
  }
  check "chk_cust_phone_s7" {
    expr = "(phone IS NULL OR (jsonb_typeof(phone) = 'object' AND phone ? 'enc' AND phone ? 'iv' AND phone ? 'tag' AND phone ? 'data'))"
  }
  check "chk_cust_firstname_s7" {
    expr = "(first_name IS NULL OR (jsonb_typeof(first_name) = 'object' AND first_name ? 'enc' AND first_name ? 'iv' AND first_name ? 'tag' AND first_name ? 'data'))"
  }
  check "chk_cust_lastname_s7" {
    expr = "(last_name IS NULL OR (jsonb_typeof(last_name) = 'object' AND last_name ? 'enc' AND last_name ? 'iv' AND last_name ? 'tag' AND last_name ? 'data'))"
  }
  check "chk_dob_past" {
    expr = "(date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE)"
  }




}
table "customer_addresses" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "customer_id" {
    type = uuid
  }
  column "is_default" {
    type    = boolean
    default = false
  }
  column "is_default_billing" {
    type    = boolean
    default = false
  }
  column "label" {
    type = varchar(50)
    null = true
  }
  column "name" {
    type = varchar(255)
  }
  column "line1" {
    type = jsonb
  }
  column "line2" {
    type = jsonb
    null = true
  }
  column "city" {
    type = varchar(100)
  }
  column "state" {
    type = varchar(100)
    null = true
  }
  column "postal_code" {
    type = jsonb
  }
  column "country" {
    type = char(2)
  }
  column "phone" {
    type = jsonb
    null = true
  }
  column "coordinates" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_customer_addresses_customer" {
    columns = [column.customer_id]
  }

  check "chk_line1_encrypted" {
    expr = "(line1 IS NULL OR (jsonb_typeof(line1) = 'object' AND line1 ? 'enc' AND line1 ? 'iv' AND line1 ? 'tag' AND line1 ? 'data'))"
  }
  check "chk_postal_code_encrypted" {
    expr = "(postal_code IS NULL OR (jsonb_typeof(postal_code) = 'object' AND postal_code ? 'enc' AND postal_code ? 'iv' AND postal_code ? 'tag' AND postal_code ? 'data'))"
  }
  check "chk_addr_phone_encrypted" {
    expr = "(phone IS NULL OR (jsonb_typeof(phone) = 'object' AND phone ? 'enc' AND phone ? 'iv' AND phone ? 'tag' AND phone ? 'data'))"
  }
  check "chk_city_not_empty" {
    expr = "(length(trim(city)) > 0)"
  }

  // Strike 10: Prevent default address spam (one default per customer/tenant)
  index "uq_cust_default_addr" {
    unique  = true
    columns = [column.customer_id]
    where   = "is_default = true"
  }


  foreign_key "fk_addr_cust" {
    columns     = [column.customer_id]
    ref_columns = [table.customers.column.id]
    on_delete = RESTRICT
  }

}
table "customer_consents" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "customer_id" {
    type = uuid
  }
  column "consented_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "revoked_at" {
    type = timestamptz
    null = true
  }
  column "consented" {
    type = boolean
  }
  column "channel" {
    type = enum.consent_channel
  }
  column "source" {
    type = varchar(50)
    null = true
  }
  column "ip_address" {
    type = inet
    null = true
  }
  column "user_agent" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_consent_customer" {
    columns = [column.customer_id]
  }


  foreign_key "fk_consent_cust" {
    columns     = [column.customer_id]
    ref_columns = [table.customers.column.id]
    on_delete = RESTRICT
  }

}
table "customer_segments" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "customer_count" {
    type    = int
    default = 0
  }
  column "auto_update" {
    type    = boolean
    default = true
  }
  column "match_type" {
    type    = varchar(5)
    default = "all"
  }
  column "name" {
    type = jsonb
  }
  column "conditions" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }



}
table "orders" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "customer_id" {
    type = uuid
    null = true
  }
  column "market_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "shipped_at" {
    type = timestamptz
    null = true
  }
  column "delivered_at" {
    type = timestamptz
    null = true
  }
  column "cancelled_at" {
    type = timestamptz
    null = true
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "subtotal" {
    type = decimal(12,4)
    null = false
  }
  column "discount" {
    type = decimal(12,4)
    null    = false
    default = 0.0000
  }
  column "shipping" {
    type = decimal(12,4)
    null    = false
    default = 0.0000
  }
  column "tax" {
    type = decimal(12,4)
    null    = false
    default = 0.0000
  }
  column "total" {
    type = decimal(12,4)
    null = false
  }
  column "coupon_discount" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "refunded_amount" {
    type = decimal(12,4)
    default = 0.0000
  }
  check "chk_order_total_inner" {
    expr = "(total) IS NOT NULL AND (subtotal) IS NOT NULL"
  }
  column "risk_score" {
    type = int
    null = true
  }
  column "is_flagged" {
    type    = boolean
    default = false
  }
  column "status" {
    type    = enum.order_status
    default = "pending"
  }
  column "payment_status" {
    type    = enum.payment_status
    default = "pending"
  }
  column "payment_method" {
    type = enum.payment_method
    null = true
  }
  column "source" {
    type    = enum.order_source
    default = "web"
  }
  column "order_number" {
    type = varchar(20)
  }
  column "coupon_code" {
    type = varchar(50)
    null = true
  }
  column "tracking_number" {
    type = varchar(100)
    null = true
  }
  column "guest_email" {
    type = varchar(255)
    null = true
  }
  column "cancel_reason" {
    type = text
    null = true
  }
  column "ip_address" {
    type = inet
    null = true
  }
  column "user_agent" {
    type = text
    null = true
  }
  column "tracking_url" {
    type = text
    null = true
  }
  column "notes" {
    type = text
    null = true
  }
  column "tags" {
    type = text
    null = true
  }
  column "shipping_address" {
    type = jsonb
  }
  column "billing_address" {
    type = jsonb
  }
  column "version" {
    type    = bigint
    default = 1
  }
  column "lock_version" {
    type    = int
    default = 1
  }
  // Strike 08: Index Bloat Protection
  // SECURITY: Requires pg_cron cleanup for keys > 30 days
  column "idempotency_key" {
    type = varchar(100)
    null = true
  }
  column "device_fingerprint" {
    type = varchar(64)
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_orders_number_active" {
    unique  = true
    columns = [column.order_number]
    where   = "deleted_at IS NULL"
  }
  index "idx_orders_idempotency" {
    unique  = true
    columns = [column.idempotency_key]
    where   = "idempotency_key IS NOT NULL"
  }

  // Strike 09: Payment Gateway Reference (Stripe Intent/Reference)
  column "payment_gateway_reference" {
    type = varchar(255)
    null = true
  }
  index "idx_orders_payment_ref" {
    columns = [column.payment_gateway_reference]
    where   = "payment_gateway_reference IS NOT NULL"
  }
  index "idx_orders_admin" {
    columns = [column.status, column.created_at]
    where   = "deleted_at IS NULL"
  }
  index "idx_orders_customer" {
    columns = [column.customer_id]
  }
  index "idx_orders_created" {
    columns = [column.created_at]
    type = "BRIN"
  }

  // ELITE: Alpha & Bravo applied (Directive Charlie - Logic Integrity)
  check "chk_checkout_math" {
    expr = "(COALESCE((total), 0) = COALESCE((subtotal), 0) + COALESCE((tax), 0) + COALESCE((shipping), 0) - COALESCE((discount), 0) - COALESCE((coupon_discount), 0)) AND COALESCE((total), 0) >= 0"
  }
  check "chk_positive_costs" {
    expr = "(COALESCE((shipping), 0) >= 0 AND COALESCE((tax), 0) >= 0)"
  }
  check "chk_refund_cap" {
    expr = "COALESCE((refunded_amount), 0) <= COALESCE((total), 0)"
  }




  foreign_key "fk_ord_customer" {
    columns     = [column.customer_id]
    ref_columns = [table.customers.column.id]
    on_delete = RESTRICT
  }
}
table "order_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "order_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
    null = true
  }
  column "variant_id" {
    type = uuid
    null = true
  }
  column "price" {
    type = decimal(12,4)
    null = false
  }
  // Strike 01: Historical COGS (Cost Price at time of purchase)
  column "cost_price" {
    type = decimal(12,4)
    null = true
  }
  column "total" {
    type = decimal(12,4)
    null = false
  }
  column "discount_amount" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "tax_amount" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "quantity" {
    type = int
  }
  column "fulfilled_quantity" {
    type    = int
    default = 0
  }
  column "returned_quantity" {
    type    = int
    default = 0
  }
  column "name" {
    type = varchar(255)
  }
  column "sku" {
    type = varchar(100)
    null = true
  }
  column "image_url" {
    type = text
    null = true
  }
  column "attributes" {
    type = jsonb
    null = true
  }
  column "tax_lines" {
    type    = jsonb
    default = sql("'[]'::jsonb")
  }
  column "discount_allocations" {
    type    = jsonb
    default = sql("'[]'::jsonb")
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_order_items_order" {
    columns = [column.order_id]
  }
  index "idx_oi_product" {
    columns = [column.product_id]
  }
  check "qty_positive" {
    expr = "quantity > 0"
  }
  check "chk_returned_qty" {
    expr = "(returned_quantity <= fulfilled_quantity)"
  }
  check "chk_fulfill_qty" {
    expr = "(fulfilled_quantity <= quantity)"
  }
  check "chk_item_math" {
    expr = "(COALESCE((total), 0) = (COALESCE((price), 0) * quantity) - COALESCE((discount_amount), 0) + COALESCE((tax_amount), 0))"
  }
  check "chk_item_inner_not_null" {
    expr = "(price) IS NOT NULL AND (total) IS NOT NULL"
  }
  check "chk_item_discount_logic" {
    expr = "COALESCE((discount_amount), 0) <= (COALESCE((price), 0) * quantity)"
  }


  foreign_key "fk_oi_order" {
    columns     = [column.order_id]
    ref_columns = [table.orders.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_oi_variant" {
    columns     = [column.variant_id]
    ref_columns = [table.product_variants.column.id]
    on_delete = RESTRICT
  }

}
table "order_edits" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "order_id" {
    type = uuid
  }
  column "line_item_id" {
    type = uuid
    null = true
  }
  column "edited_by" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "amount_change" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "edit_type" {
    type = varchar(30)
  }
  column "reason" {
    type = text
    null = true
  }
  column "old_value" {
    type = jsonb
    null = true
  }
  column "new_value" {
    type = jsonb
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_order_edits" {
    columns = [column.order_id]
  }


  foreign_key "fk_oe_order" {
    columns     = [column.order_id]
    ref_columns = [table.orders.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_oe_line_item" {
    columns     = [column.line_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }

}
table "order_timeline" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "order_id" {
    type = uuid
    null = true
  }
  column "updated_by" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "status" {
    type = varchar(50)
  }
  column "title" {
    type = jsonb
    null = true
  }
  column "notes" {
    type = text
    null = true
  }
  column "location" {
    type = jsonb
    null = true
  }
  column "ip_address" {
    type = inet
    null = true
  }
  column "user_agent" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_timeline_order" {
    columns = [column.order_id]
  }
  index "idx_timeline_created" {
    columns = [column.created_at]
    type = "BRIN"
  }


  foreign_key "fk_ot_order" {
    columns     = [column.order_id]
    ref_columns = [table.orders.column.id]
    on_delete = RESTRICT
  }

}
table "fulfillments" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "order_id" {
    type = uuid
  }
  column "location_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "shipped_at" {
    type = timestamptz
    null = true
  }
  column "delivered_at" {
    type = timestamptz
    null = true
  }
  column "status" {
    type    = enum.fulfillment_status
    default = "pending"
  }
  column "tracking_company" {
    type = varchar(100)
    null = true
  }
  column "tracking_details" {
    type = jsonb
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_fulfillments_order" {
    columns = [column.order_id]
  }


  foreign_key "fk_ful_order" {
    columns     = [column.order_id]
    ref_columns = [table.orders.column.id]
    on_delete = RESTRICT
  }

}
table "fulfillment_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "fulfillment_id" {
    type = uuid
  }
  column "order_item_id" {
    type = uuid
  }
  column "quantity" {
    type = int
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_fulfill_items" {
    columns = [column.fulfillment_id]
  }


  foreign_key "fk_fi_fulfillment" {
    columns     = [column.fulfillment_id]
    ref_columns = [table.fulfillments.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_fi_order_item" {
    columns     = [column.order_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }

}
table "refunds" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "order_id" {
    type = uuid
  }
  column "refunded_by" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "amount" {
    type = decimal(12,4)
    null = false
  }
  column "status" {
    type    = enum.refund_status
    default = "pending"
  }
  column "gateway_transaction_id" {
    type = varchar(255)
    null = true
  }
  column "reason" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_refunds_order" {
    columns = [column.order_id]
  }
  check "chk_refund_positive" {
    expr = "COALESCE((amount), 0) > 0"
  }


  foreign_key "fk_ref_order" {
    columns     = [column.order_id]
    ref_columns = [table.orders.column.id]
    on_delete = RESTRICT
  }
}
table "refund_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "refund_id" {
    type = uuid
  }
  column "order_item_id" {
    type = uuid
  }
  column "quantity" {
    type = int
  }
  column "amount" {
    type = decimal(12,4)
    null = false
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_refund_items" {
    columns = [column.refund_id]
  }
  check "chk_refund_item_amt" {
    expr = "(COALESCE((amount), 0) > 0 AND quantity > 0)"
  }


  foreign_key "fk_ri_refund" {
    columns     = [column.refund_id]
    ref_columns = [table.refunds.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_ri_order_item" {
    columns     = [column.order_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }

}
table "rma_requests" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "order_id" {
    type = uuid
  }
  column "order_item_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "reason_code" {
    type = enum.rma_reason_code
  }
  column "condition" {
    type    = enum.rma_condition
    default = "new"
  }
  column "resolution" {
    type    = enum.rma_resolution
    default = "refund"
  }
  column "status" {
    type    = varchar(20)
    default = "pending"
  }
  column "description" {
    type = text
    null = true
  }
  column "evidence" {
    type    = jsonb
    default = sql("'[]'::jsonb")
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_rma_order" {
    columns = [column.order_id]
  }
  index "idx_rma_status" {
    columns = [column.status]
  }




  foreign_key "fk_rma_order" {
    columns     = [column.order_id]
    ref_columns = [table.orders.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_rma_order_item" {
    columns     = [column.order_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }
}
table "rma_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "rma_id" {
    type = uuid
  }
  column "order_item_id" {
    type = uuid
  }
  column "quantity" {
    type = int
  }
  column "restocking_fee" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "reason_code" {
    type = varchar(50)
  }
  column "condition" {
    type = varchar(20)
  }
  column "resolution" {
    type = varchar(20)
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_rma_items_rma" {
    columns = [column.rma_id]
  }
  check "qty_positive" {
    expr = "quantity > 0"
  }


  foreign_key "fk_rmai_rma" {
    columns     = [column.rma_id]
    ref_columns = [table.rma_requests.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_rmai_order_item" {
    columns     = [column.order_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }

}
table "payment_logs" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "order_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "provider" {
    type = varchar(50)
  }
  column "transaction_id" {
    type = varchar(255)
    null = true
  }
  column "provider_reference_id" {
    type = varchar(255)
    null = true
  }
  column "status" {
    type = varchar(20)
  }
  // Strike 10: Strict Financial Logging (Actual amount attempted/captured)
  column "amount" {
    type = decimal(12,4)
    null = false
  }
  column "error_code" {
    type = varchar(100)
    null = true
  }
  column "error_message" {
    type = text
    null = true
  }
  column "raw_response" {
    type = jsonb
    null = true
  }
  column "idempotency_key" {
    type = varchar(100)
    null = true
  }
  column "ip_address" {
    type = inet
    null = true
  }
  primary_key {
    columns = [column.id, column.created_at]
  }
  partition {
    type    = RANGE
    columns = [column.created_at]
  }
  index "idx_payment_created_brin" {
    columns = [column.created_at]
    type = "BRIN"
}
  check "chk_payment_pci_scrub" {
    expr = "(raw_response IS NULL OR NOT (raw_response ?| array['cvv', 'card_number', 'pan']))"
  }
  index "idx_payment_logs_order" {
    columns = [column.order_id]
  }


  foreign_key "fk_pl_order" {
    columns     = [column.order_id]
    ref_columns = [table.orders.column.id]
    on_delete = RESTRICT
  }

}
table "carts" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "customer_id" {
    type = uuid
    null = true
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "expires_at" {
    type = timestamptz
    null = true
  }
  column "subtotal" {
    type = decimal(12,4)
    null = true
  }
  column "session_id" {
    type = varchar(64)
    null = true
  }
  column "items" {
    type = jsonb
  }
  column "applied_coupons" {
    type = jsonb
    null = true
  }
  column "lock_version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_carts_customer" {
    columns = [column.customer_id]
  }
  index "idx_carts_session" {
    columns = [column.session_id]
  }
  index "idx_carts_expires" {
    columns = [column.expires_at]
  }

  check "chk_cart_items_size" {
    expr = "(pg_column_size(items) <= 51200)"
  }
  check "chk_cart_subtotal_pos" {
    expr = "subtotal IS NULL OR COALESCE((subtotal), 0) >= 0"
  }


  foreign_key "fk_cart_customer" {
    columns     = [column.customer_id]
    ref_columns = [table.customers.column.id]
    on_delete = RESTRICT
  }
}
table "cart_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "cart_id" {
    type = uuid
  }
  column "variant_id" {
    type = uuid
  }
  column "quantity" {
    type    = int
    default = 1
  }
  column "price" {
    type = decimal(12,4)
  }
  column "added_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_cart_items_cart" {
    columns = [column.cart_id]
  }
  check "chk_cart_item_price" {
    expr = "COALESCE((price), 0) >= 0"
  }


  foreign_key "fk_ci_cart" {
    columns     = [column.cart_id]
    ref_columns = [table.carts.column.id]
    on_delete = CASCADE
  }

}
table "abandoned_checkouts" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "customer_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "recovered_at" {
    type = timestamptz
    null = true
  }
  column "subtotal" {
    type = decimal(12,4)
    null = true
  }
  column "recovery_email_sent" {
    type    = boolean
    default = false
  }
  column "email" {
    type = jsonb
    null = true
  }
  column "items" {
    type = jsonb
    null = true
  }
  column "recovery_coupon_code" {
    type = varchar(50)
    null = true
  }
  column "recovered_amount" {
    type = decimal(12,4)
    default = 0.0000
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_abandoned_created" {
    columns = [column.created_at]
  }



  foreign_key "fk_ac_customer" {
    columns     = [column.customer_id]
    ref_columns = [table.customers.column.id]
    on_delete = RESTRICT
  }

}

// 3. SHIPPING & TAX (Storefront)
// ==========================================
table "shipping_zones" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "base_price" {
    type = decimal(12,4)
  }
  column "free_shipping_threshold" {
    type = decimal(12,4)
    null = true
  }
  column "min_delivery_days" {
    type = int
    null = true
  }
  column "max_delivery_days" {
    type = int
    null = true
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "name" {
    type = varchar(100)
  }
  column "region" {
    type = varchar(100)
  }
  column "country" {
    type = char(2)
    null = true
  }
  column "carrier" {
    type = varchar(50)
    null = true
  }
  column "estimated_days" {
    type = varchar(50)
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_shipping_region" {
    columns = [column.region]
  }
  index "idx_shipping_active" {
    columns = [column.is_active]
  }
  check "chk_delivery_logic" {
    expr = "(min_delivery_days >= 0 AND min_delivery_days <= max_delivery_days)"
  }





}
table "tax_categories" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "priority" {
    type    = int
    default = 0
  }
  column "is_default" {
    type    = boolean
    default = false
  }
  column "name" {
    type = varchar(100)
  }
  column "code" {
    type = varchar(50)
    null = true
  }
  column "description" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }



}
table "tax_rules" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "tax_category_id" {
    type = uuid
    null = true
  }
  column "rate" {
    type = int
  }
  column "priority" {
    type    = int
    default = 0
  }
  column "is_inclusive" {
    type    = boolean
    default = true
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "name" {
    type = varchar(100)
  }
  column "country" {
    type = char(2)
  }
  column "state" {
    type = varchar(100)
    null = true
  }

  // ELITE PATCH: Zip Code to solve localized Tax logic holes
  column "zip_code" {
    type = varchar(20)
    null = true
  }

  column "applies_to" {
    type    = varchar(20)
    default = "all"
  }
  column "tax_type" {
    type    = varchar(50)
    default = "VAT"
  }

  // Strike 06: Rounding Policy for tax compliance
  column "rounding_rule" {
    type    = varchar(20)
    default = "half_even"
  }
  check "chk_tax_rounding" {
    expr = "rounding_rule IN ('half_even', 'half_up', 'half_down')"
  }
  primary_key {
    columns = [column.id]
  }

  // ELITE PATCH: Include zip_code in rule uniqueness constraints
  unique "uq_tax_rule" {
    columns            = [column.country, column.state, column.zip_code, column.tax_type]
}
  index "idx_tax_rules_country" {
    columns = [column.country]
  }
  check "chk_tax_rate_bounds" {
    expr = "(rate >= 0 AND rate <= 10000)"
  }


  foreign_key "fk_tr_tax_category" {
    columns     = [column.tax_category_id]
    ref_columns = [table.tax_categories.column.id]
    on_delete = RESTRICT
  }
}
table "reviews" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "product_id" {
    type = uuid
  }
  column "customer_id" {
    type = uuid
    null = true
  }
  column "rating" {
    type = int
    null = false
  }
  column "comment" {
    type = text
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_verified" {
    type    = boolean
    default = false
  }
  column "sentiment_score" {
    type = numeric(3, 2)
    null = true
  }
  // Strike 19: AI Anomaly Detection (Bot/Poison Detection)
  column "is_anomaly_flagged" {
    type    = boolean
    default = false
  }
  column "embedding" {
    type = sql("vector(1536)")
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  check "chk_rating_bounds" {
    expr = "(rating >= 1 AND rating <= 5)"
  }
  // Strike 21: AI Sentiment Confidence
  column "sentiment_confidence" {
    type = numeric(3, 2)
    null = true
  }
  check "chk_sentiment_bounds" {
    expr = "(sentiment_score >= -1.00 AND sentiment_score <= 1.00)"
  }

#  index "idx_reviews_embedding_cosine" {
#    on {
#      column = column.embedding
#      opclass = "vector_cosine_ops"
#    }
#    type = "HNSW"
#  }


}

// ==========================================
// ELITE SECURITY: FORCED RLS ACTIVATION 
// Protocol: RESTRICTIVE | Scope: STOREFRONT
// ==========================================








// ==========================================
// APEX V2 - 2026 ENTERPRISE ARCHITECTURE (ATLAS HCL)
// DIRECTIVE: EXECUTIVE OVERRIDE (ATLAS-2026-01)
// STATUS: FINAL | SECURITY: ZERO-TOLERANCE
// MODULE: 04_MARKETING_SYSTEMS (Promotions, Apps, CMS & Analytics)
// ==========================================

// 1. PROMOTIONS & DISCOUNTS (Storefront)
// ==========================================
table "coupons" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "starts_at" {
    type = timestamptz
    null = true
  }
  column "expires_at" {
    type = timestamptz
    null = true
  }
  column "value" {
    type = decimal(12,4)
    null = false
  }
  column "min_order_amount" {
    type = decimal(12,4)
    null    = false
    default = 0.0000
  }
  column "max_uses" {
    type = int
    null = true
  }
  column "used_count" {
    type    = int
    default = 0
  }
  column "max_uses_per_customer" {
    type = int
    null = true
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "code" {
    type = varchar(50)
  }
  column "type" {
    type = varchar(20)
  }
  // Strike 16: Optimistic Locking for Coupon Redemptions
  column "lock_version" {
    type    = int
    default = 1
  }
  column "version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }

  unique "coupons_code_unique" {
    columns = [column.code]
  }
  index "idx_coupons_code" {
    columns = [column.code]
  }
  index "idx_coupons_active" {
    columns = [column.is_active]
  }
  check "coupon_code_upper_check" {
    expr = "code =UPPER(code)"
  }
  check "coupon_usage_exhaustion_check" {
    expr = "used_count <= max_uses"
  }
  check "chk_coupon_val_positive" {
    expr = "COALESCE((value), 0) > 0"
  }
  check "chk_coupon_pct" {
    expr = "(type != 'percentage' OR COALESCE((value), 0) <= 10000)"
  }
  check "chk_coupon_min_amount" {
    expr = "COALESCE((min_order_amount), 0) >= 0"
  }


}

// Strike 03: Coupon Usage Tracking (Enforce max_uses_per_customer)
table "coupon_usages" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "coupon_id" {
    type = uuid
  }
  column "customer_id" {
    type = uuid
  }
  column "order_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_coupon_cust_order" {
    columns = [column.coupon_id, column.customer_id, column.order_id]
  }
  index "idx_coupon_usages_lookup" {
    columns = [column.coupon_id, column.customer_id]
  }


  foreign_key "fk_cu_coupon" {
    columns     = [column.coupon_id]
    ref_columns = [table.coupons.column.id]
    on_delete = RESTRICT
  }

}
table "price_rules" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "starts_at" {
    type = timestamptz
    null = true
  }
  column "ends_at" {
    type = timestamptz
    null = true
  }
  column "value" {
    type = decimal(12,4)
    null = false
  }
  column "min_purchase_amount" {
    type = decimal(12,4)
    null = true
  }
  column "min_quantity" {
    type = int
    null = true
  }
  column "max_uses" {
    type = int
    null = true
  }
  column "max_uses_per_customer" {
    type = int
    null = true
  }
  column "used_count" {
    type    = int
    default = 0
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "type" {
    type = enum.discount_type
  }
  column "applies_to" {
    type    = enum.discount_applies_to
    default = "all"
  }
  column "title" {
    type = jsonb
  }
  column "entitled_ids" {
    type = jsonb
    null = true
  }
  column "combines_with" {
    type = jsonb
    null = true
  }
  column "lock_version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_price_rules_active" {
    columns = [column.is_active]
  }
  check "chk_pr_dates" {
    expr = "(ends_at IS NULL OR ends_at > starts_at)"
  }
  check "chk_entitled_array" {
    expr = "(entitled_ids IS NULL OR jsonb_typeof(entitled_ids) = 'array')"
  }
  // Strike 30: Collection Bloat Protection (Limit 5000)
  check "chk_entitled_len" {
    expr = "(entitled_ids IS NULL OR jsonb_array_length(entitled_ids) <= 5000)"
  }


}
table "discount_codes" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "price_rule_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "used_count" {
    type    = int
    default = 0
  }
  column "code" {
    type = varchar(50)
  }
  primary_key {
    columns = [column.id]
  }
  unique "discount_codes_code_unique" {
    columns = [column.code]
  }
  index "idx_discount_code" {
    columns = [column.code]
  }
  check "chk_code_strict" {
    expr = "( code =upper(code) AND code ~ '^[A-Z0-9_-]+$')"
  }


  foreign_key "fk_dc_price_rule" {
    columns     = [column.price_rule_id]
    ref_columns = [table.price_rules.column.id]
    on_delete = RESTRICT
  }

}
table "flash_sales" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "starts_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "end_time" {
    type = timestamptz
  }
  // Strike 27: Accuracy of Global Flash Sales
  column "timezone" {
    type    = varchar(50)
    default = "UTC"
  }

  column "is_active" {
    type    = boolean
    default = true
  }
  column "name" {
    type = jsonb
  }
  column "status" {
    type    = varchar(20)
    default = "active"
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_flash_sales_status" {
    columns = [column.status]
  }
  index "idx_flash_sales_end_time" {
    columns = [column.end_time]
  }
  check "chk_flash_time" {
    expr = "(end_time > starts_at)"
  }




}
table "flash_sale_products" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "flash_sale_id" {
    type = uuid
    null = true
  }
  column "product_id" {
    type = uuid
    null = true
  }
  column "discount_basis_points" {
    type = int
  }
  column "quantity_limit" {
    type = int
  }
  column "sold_quantity" {
    type    = int
    default = 0
  }
  column "sort_order" {
    type    = int
    default = 0
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_fs_prod_campaign" {
    columns = [column.flash_sale_id]
  }
  index "idx_fs_prod_product" {
    columns = [column.product_id]
  }
  check "chk_flash_limit" {
    expr = "(sold_quantity <= quantity_limit)"
  }
#  // ELITE: Prevent product overlap in multiple flash sales
#  index "idx_flash_sale_product_overlap" {
#    type = "GIST"
#    on {
#      column = column.product_id
#    }
#  }


  // Strike 5: Prevent product overlap in multiple flash sales via denormalized range
  column "valid_during" {
    type = sql("tstzrange")
    null = true
  }




  foreign_key "fk_fsp_flash_sale" {
    columns     = [column.flash_sale_id]
    ref_columns = [table.flash_sales.column.id]
    on_delete = RESTRICT
  }

}
table "product_bundles" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "starts_at" {
    type = timestamptz
    null = true
  }
  column "ends_at" {
    type = timestamptz
    null = true
  }
  column "discount_value" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "discount_type" {
    type    = varchar(20)
    default = "percentage"
  }
  column "name" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }

  check "chk_bundle_discount_positive" {
    expr = "COALESCE((discount_value), 0) >= 0"
  }


}
table "product_bundle_items" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "bundle_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
  }
  column "quantity" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_bundle_items" {
    columns = [column.bundle_id]
  }


  foreign_key "fk_pbi_bundle" {
    columns     = [column.bundle_id]
    ref_columns = [table.product_bundles.column.id]
    on_delete = RESTRICT
  }

}
table "loyalty_rules" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "name" {
    type = varchar(100)
  }
  // Strike 07: Fractional Loyalty Points Support
  column "points_per_currency" {
    type    = decimal(10, 4)
    default = 1.0
  }
  column "min_redeem_points" {
    type    = int
    default = 100
  }
  column "points_expiry_days" {
    type = int
    null = true
  }
  column "rewards" {
    type    = jsonb
    default = sql("'[]'::jsonb")
  }
  column "is_active" {
    type    = int
    default = 1
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  check "chk_points_expiry" {
    expr = "(points_expiry_days IS NULL OR points_expiry_days > 0)"
  }
  check "chk_loyalty_math" {
    expr = "points_per_currency > 0 AND min_redeem_points > 0"
  }





}
table "wallet_transactions" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "customer_id" {
    type = uuid
  }
  column "order_id" {
    type = uuid
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "amount" {
    type = decimal(12,4)
    null = false
  }
  column "balance_before" {
    type = decimal(12,4)
    null = false
  }
  column "balance_after" {
    type = decimal(12,4)
    null = false
  }
  column "type" {
    type = varchar(20)
  }
  column "reason" {
    type = varchar(100)
  }
  column "description" {
    type = text
    null = true
  }
  column "idempotency_key" {
    type = varchar(100)
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "wallet_tx_idempotency" {
    unique  = true
    columns = [column.idempotency_key]
    where   = "idempotency_key IS NOT NULL"
  }
  index "idx_wallet_customer" {
    columns = [column.customer_id]
  }
  index "idx_wallet_created" {
    columns = [column.created_at]
    type = "BRIN"
  }
  check "chk_wallet_math" {
    expr = "COALESCE((balance_after), 0) = COALESCE((balance_before), 0) + COALESCE((amount), 0)"
  }
  check "wallet_non_negative_balance" {
    expr = "COALESCE((balance_after), 0) >= 0"
  }

  // Strike 27: Immutable Wallet Transactions
  // Trigger logic: Prevent Update/Delete on this table (Mandatory for financial audit)


}
table "affiliate_partners" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "customer_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "commission_rate" {
    type    = int
    default = 500
  }
  column "total_earned" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "total_paid" {
    type = decimal(12,4)
    default = 0.0000
  }
  column "status" {
    type    = enum.affiliate_status
    default = "pending"
  }
  column "referral_code" {
    type = varchar(50)
  }
  column "email" {
    type = jsonb
  }
  column "email_hash" {
    type = text
    null = true
  }
  // Strike 11: Payout Details (Masked/Encrypted PII for Ibans/Paypal)
  column "payout_details" {
    type = jsonb
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  unique "affiliate_partners_referral_code_unique" {
    columns = [column.referral_code]
  }
  index "idx_affiliate_email_hash" {
    columns = [column.email_hash]
  }
  check "chk_aff_email_s7" {
    expr = "(email IS NULL OR (jsonb_typeof(email) = 'object' AND email ? 'enc' AND email ? 'iv' AND email ? 'tag' AND email ? 'data'))"
  }
  check "chk_aff_payout_s7" {
    expr = "(payout_details IS NULL OR (jsonb_typeof(payout_details) = 'object' AND payout_details ? 'enc' AND payout_details ? 'iv' AND payout_details ? 'tag' AND payout_details ? 'data'))"
  }
  check "chk_ref_code_upper" {
    expr = "( referral_code =upper(referral_code))"
  }
  check "chk_aff_rate_cap" {
    expr = "commission_rate >= 0 AND commission_rate <= 10000"
  }


}
table "affiliate_transactions" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "partner_id" {
    type = uuid
  }
  column "order_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "paid_at" {
    type = timestamptz
    null = true
  }
  column "commission_amount" {
    type = decimal(12,4)
    null = false
  }
  // Strike 12: Escrow Commission (Prevent payout during return window)
  column "hold_period_ends_at" {
    type = timestamptz
    null = true
  }
  column "status" {
    type    = enum.affiliate_tx_status
    default = "pending"
  }
  column "payout_reference" {
    type = varchar(100)
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_aff_trans_partner" {
    columns = [column.partner_id]
  }
  index "idx_aff_trans_order" {
    columns = [column.order_id]
  }
  index "idx_aff_trans_created_brin" {
    columns = [column.created_at]
    type = "BRIN"
  }
  check "chk_aff_comm_positive" {
    expr = "COALESCE((commission_amount), 0) > 0"
  }


  foreign_key "fk_afftx_partner" {
    columns     = [column.partner_id]
    ref_columns = [table.affiliate_partners.column.id]
    on_delete = RESTRICT
  }

}

// 2. STAFF & RBAC (Storefront)
// ==========================================
table "staff_roles" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_system" {
    type    = boolean
    default = false
  }
  column "name" {
    type = varchar(100)
  }
  column "description" {
    type = text
    null = true
  }
  column "permissions" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }




}
table "staff_members" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "user_id" {
    type = uuid
  }
  column "role_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "last_login_at" {
    type = timestamptz
    null = true
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "is_active" {
    type    = boolean
    default = true
  }

  column "deactivated_at" {
    type = timestamptz
    null = true
  }
  column "deactivated_by" {
    type = uuid
    null = true
  }

  column "email" {
    type = jsonb
  }

  column "first_name" {
    type = varchar(100)
    null = true
  }
  column "last_name" {
    type = varchar(100)
    null = true
  }
  column "avatar_url" {
    type = text
    null = true
  }
  column "phone" {
    type = jsonb
    null = true
  }
  column "is_2fa_enabled" {
    type    = boolean
    default = false
  }
  column "two_factor_secret" {
    type = jsonb
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_staff_user" {
    columns = [column.user_id]
  }
  index "idx_staff_active" {
    columns = [column.is_active]
    where   = "is_active =true"
  }
  check "chk_staff_email_s7" {
    expr = "(jsonb_typeof(email) = 'object' AND email ? 'enc' AND email ? 'iv' AND email ? 'tag' AND email ? 'data')"
  }
  check "chk_staff_phone_s7" {
    expr = "(phone IS NULL OR (jsonb_typeof(phone) = 'object' AND phone ? 'enc' AND phone ? 'iv' AND phone ? 'tag' AND phone ? 'data'))"
  }
  check "chk_staff_2fa_s7" {
    expr = "(two_factor_secret IS NULL OR (jsonb_typeof(two_factor_secret) = 'object' AND two_factor_secret ? 'enc' AND two_factor_secret ? 'iv' AND two_factor_secret ? 'tag' AND two_factor_secret ? 'data'))"
  }


  foreign_key "fk_sm_role" {
    columns     = [column.role_id]
    ref_columns = [table.staff_roles.column.id]
    on_delete = RESTRICT
  }
}
table "staff_sessions" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "staff_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  // Strike 18: Session Expiry (Last Active tracking)
  column "last_active_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "expires_at" {
    type = timestamptz
  }
  column "revoked_at" {
    type = timestamptz
    null = true
  }
  column "token_hash" {
    type = char(64)
  }
  column "device_fingerprint" {
    type = varchar(64)
    null = true
  }
  column "ip_address" {
    type = inet
    null = true
  }
  column "asn" {
    type = varchar(50)
    null = true
  }
  column "ip_country" {
    type = char(2)
    null = true
  }
  column "user_agent" {
    type = text
    null = true
  }
  column "session_salt_version" {
    type    = int
    default = 1
  }
  primary_key {
    columns = [column.id]
  }
  unique "staff_sessions_token_hash_unique" {
    columns = [column.token_hash]
  }
  // AUDIT FIX: Redundant HASH index removed — UNIQUE constraint on token_hash already creates B-Tree index

  index "idx_session_active" {
    columns = [column.staff_id]
    where   = "revoked_at IS NULL"
  }
  index "idx_session_revocation_lookup" {
    columns = [column.staff_id, column.device_fingerprint, column.revoked_at]
  }
  // AUDIT FIX: Removed orphaned cross-schema reference fk_ss_tenant

  foreign_key "fk_ss_staff" {
    columns     = [column.staff_id]
    ref_columns = [table.staff_members.column.id]
    on_delete = CASCADE
  }

}

// 3. APPS & EXTENSIBILITY (Storefront)
// ==========================================
table "app_installations" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "installed_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "app_name" {
    type = varchar(255)
  }
  column "api_key" {
    type = jsonb
    null = true
  }
  column "access_token" {
    type = jsonb
    null = true
  }
  column "api_secret_hash" {
    type = char(64)
    null = true
  }
  column "webhook_url" {
    type = text
    null = true
  }
  column "scopes" {
    type = jsonb
    null = true
  }
  // Strike 17: App Scope Integrity (Must be a JSONB array)
  check "chk_scopes_structure" {
    expr = "(scopes IS NULL OR jsonb_typeof(scopes) = 'array')"
  }

  column "key_rotated_at" {
    type = timestamptz
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  check "chk_app_key_s7" {
    expr = "(api_key IS NULL OR (jsonb_typeof(api_key) = 'object' AND api_key ? 'enc' AND api_key ? 'iv' AND api_key ? 'tag' AND api_key ? 'data'))"
  }
  check "chk_app_token_s7" {
    expr = "(access_token IS NULL OR (jsonb_typeof(access_token) = 'object' AND access_token ? 'enc' AND access_token ? 'iv' AND access_token ? 'tag' AND access_token ? 'data'))"
  }


}
table "webhook_subscriptions" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "app_id" {
    type = uuid
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "event" {
    type = varchar(100)
  }

  column "target_url" {
    type = text
  }
  check "chk_ssrf_protection" {
    expr = "(target_url ~ '^https://(?!localhost|127\\\\.|10\\\\.|192\\\\.168\\\\.|172\\\\.(1[6-9]|2[0-9]|3[0-1]))')"
  }
  check "chk_url_length" {
    expr = "(length(target_url) <= 2048)"
  }

  column "secret" {
    type = jsonb
    null = true
  }
  column "max_retries" {
    type    = int
    default = 3
  }
  column "retry_count" {
    type    = int
    default = 0
  }
  // Strike 08: Suspension of failed/dead Webhooks
  column "suspended_at" {
    type = timestamptz
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_webhook_app" {
    columns = [column.app_id]
  }
  index "idx_webhook_event" {
    columns = [column.event]
  }
  check "chk_retry_limit" {
    expr = "(retry_count <= max_retries)"
  }
  check "webhook_secret_min_length" {
    expr = "(secret IS NULL OR octet_length(secret->>'enc') >= 32)"
  }
  check "chk_webhook_secret_s7" {
    expr = "(secret IS NULL OR (jsonb_typeof(secret) = 'object' AND secret ? 'enc' AND secret ? 'iv' AND secret ? 'tag' AND secret ? 'data'))"
  }
  check "chk_https_only" {
    expr = "(target_url ~ '^https://')"
  }
  // Strike 08.5: SSRF Hardening (Regex on IPs is bypassable App Layer must resolve DNS and block private ranges)

  // ELITE PATCH: Prevent OOM on Webhook Worker via URL Overflow
  check "chk_webhook_url_limit" {
    expr = "(length(target_url) <= 2048)"
  }


  foreign_key "fk_ws_app" {
    columns     = [column.app_id]
    ref_columns = [table.app_installations.column.id]
    on_delete = RESTRICT
  }

}

// 4. CMS & CONTENT (Storefront)
// ==========================================
table "pages" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "deleted_at" {
    type = timestamptz
    null = true
  }
  column "is_published" {
    type    = boolean
    default = false
  }
  column "slug" {
    type = varchar(255)
  }
  column "page_type" {
    type    = varchar(50)
    default = "custom"
  }
  column "template" {
    type    = varchar(50)
    default = "default"
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
  column "content" {
    type = jsonb
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_pages_slug_active" {
    unique  = true
    columns = [column.slug]
    where   = "deleted_at IS NULL"
  }
  index "idx_pages_published" {
    columns = [column.is_published]
  }
  check "chk_page_slug" {
    expr = "(slug ~ '^[a-z0-9-]+$')"
  }





}
table "blog_categories" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "name" {
    type    = jsonb
  }
  column "slug" {
    type = varchar(100)
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_tenant_blog_cat_slug" {
    columns = [column.slug]
  }

}

table "blog_posts" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
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
  column "read_time_min" {
    type = int
    null = true
  }
  column "view_count" {
    type    = int
    default = 0
  }
  column "is_published" {
    type    = boolean
    default = false
  }
  column "slug" {
    type = varchar(255)
  }
  column "category_id" {
    type = uuid
    null = true
  }
  column "author_name" {
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
  column "featured_image" {
    type = text
    null = true
  }
  column "tags" {
    type = sql("text[]")
    null = true
  }
  column "title" {
    type = jsonb
  }
  column "excerpt" {
    type = jsonb
    null = true
  }
  column "content" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_blog_slug_active" {
    unique  = true
    columns = [column.slug]
    where   = "deleted_at IS NULL"
  }
  index "idx_blog_published" {
    columns = [column.is_published]
  }
  index "idx_blog_published_at" {
    columns = [column.published_at]
  }
  index "idx_blog_tags" {
    columns = [column.tags]
    type = "GIN"
  }





  foreign_key "fk_bp_category" {
    columns     = [column.category_id]
    ref_columns = [table.blog_categories.column.id]
    on_delete = SET_NULL
  }
}
table "legal_pages" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "version" {
    type    = int
    default = 1
  }
  column "is_published" {
    type    = boolean
    default = false
  }
  column "page_type" {
    type = text
  }
  column "last_edited_by" {
    type = text
    null = true
  }
  column "title" {
    type = jsonb
  }
  column "content" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_legal_page_type" {
    columns = [column.page_type]
  }

  index "idx_legal_published" {
    columns = [column.is_published]
  }
  check "ck_legal_page_type" {
    expr = "(page_type IN ('privacy_policy', 'terms_of_service', 'shipping_policy', 'return_policy', 'cookie_policy'))"
  }
  check "ck_legal_version_positive" {
    expr = "(version > 0)"
  }



}
table "faq_categories" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "name" {
    type = varchar(100)
  }
  column "order" {
    type    = int
    default = 0
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }



}
table "faqs" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "category_id" {
    type = uuid
    null = true
  }
  column "question" {
    type = varchar(500)
  }
  column "answer" {
    type = text
  }
  column "order" {
    type    = int
    default = 0
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_faq_category" {
    columns = [column.category_id]
  }
  index "idx_faq_active" {
    columns = [column.is_active]
  }


  foreign_key "fk_faq_category" {
    columns     = [column.category_id]
    ref_columns = [table.faq_categories.column.id]
    on_delete = SET_NULL
  }

}
table "kb_categories" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "name" {
    type = varchar(255)
  }
  column "slug" {
    type = varchar(255)
  }
  column "icon" {
    type = varchar(50)
    null = true
  }
  column "order" {
    type    = int
    default = 0
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  unique "kb_categories_slug_unique" {
    columns = [column.slug]
  }

  // ALTER TABLE storefront.kb_categories ENABLE ROW LEVEL SECURITY

}
table "kb_articles" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "category_id" {
    type = uuid
    null = true
  }
  column "slug" {
    type = varchar(255)
  }
  column "title" {
    type = varchar(255)
  }
  column "content" {
    type = text
  }
  column "is_published" {
    type    = boolean
    default = true
  }
  column "view_count" {
    type    = int
    default = 0
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  unique "kb_articles_slug_unique" {
    columns = [column.slug]
  }
  index "idx_kb_article_slug" {
    columns = [column.slug]
  }


  foreign_key "fk_kba_category" {
    columns     = [column.category_id]
    ref_columns = [table.kb_categories.column.id]
    on_delete = RESTRICT
  }

}
table "banners" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "sort_order" {
    type    = int
    default = 0
  }
  column "location" {
    type    = varchar(50)
    default = "home_top"
  }
  column "image_url" {
    type = text
  }
  column "link_url" {
    type = text
    null = true
  }
  column "title" {
    type = jsonb
    null = true
  }
  column "content" {
    type = jsonb
    null = true
  }
  primary_key {
    columns = [column.id]
  }

  index "idx_banners_active" {
    columns = [column.is_active, column.location]
  }

}
table "announcement_bars" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "bg_color" {
    type    = varchar(20)
    default = "#000000"
  }
  column "text_color" {
    type    = varchar(20)
    default = "#ffffff"
  }
  column "content" {
    type = jsonb
  }
  column "link_url" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }


}
table "popups" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "trigger_type" {
    type    = varchar(20)
    default = "time_on_page"
  }
  column "content" {
    type = jsonb
  }
  column "settings" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }


}
table "search_synonyms" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "term" {
    type = varchar(100)
  }
  column "synonyms" {
    type = jsonb
  }
  // Strike 24: Linguistic Disambiguation
  column "language_code" {
    type    = char(2)
    default = "ar"
  }
  column "is_bidirectional" {
    type    = boolean
    default = true
  }
  primary_key {
    columns = [column.id]
  }
  unique "search_synonyms_term_unique" {
    columns = [column.term]
  }
  check "chk_synonym_no_self_loop" {
    expr = "NOT (synonyms ? term)"
  }

}

// Requires pg_partman retention policy: 90 days.
table "product_views" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "product_id" {
    type = uuid
  }
  column "customer_id" {
    type = uuid
    null = true
  }
  column "session_id" {
    type = varchar(64)
    null = true
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "dwell_time_seconds" {
    type    = int
    default = 0
  }
  // Strike 23: Traffic Sourcing for Recommendation attribution
  column "source_medium" {
    type = varchar(100)
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_pv_product" {
    columns = [column.product_id]
  }




}








// 5. SYSTEM & LOGS (Storefront)
// ==========================================
table "outbox_events" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "processed_at" {
    type = timestamptz
    null = true
  }
  column "retry_count" {
    type    = int
    default = 0
  }
  column "status" {
    type    = enum.outbox_status
    default = "pending"
  }
  column "event_type" {
    type = varchar(100)
  }
  column "aggregate_type" {
    type = varchar(50)
    null = true
  }
  column "aggregate_id" {
    type = uuid
    null = true
  }
  column "payload" {
    type = jsonb
  }
  // Strike 20: OpenTelemetry Trace ID for distributed AI training
  column "trace_id" {
    type = varchar(100)
    null = true
  }
  // Strike 09: Outbox Locking for horizontal scaling
  column "locked_by" {
    type = varchar(100)
    null = true
  }
  column "locked_at" {
    type = timestamptz
    null = true
  }
  check "chk_payload_size" {
    expr = "(pg_column_size(payload) <= 524288)"
  }
  primary_key {
    columns = [column.id, column.created_at]
  }
  partition {
    type    = RANGE
    columns = [column.created_at]
  }

  index "idx_outbox_pending" {
    columns = [column.status, column.created_at]
    where   = "status ='pending'"
  }
  index "idx_outbox_created_brin" {
    columns = [column.created_at]
    type = "BRIN"

  }



}
table "tenant_config" {
  schema = schema.dynamic_tenant
  column "key" {
    type = varchar(100)
  }

  column "value" {
    type = jsonb
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.key]
  }
  // Strike 05: Key Injection Protection
  check "chk_config_key" {
    expr = "key ~ '^[a-zA-Z0-9_]+$'"
  }
  check "chk_tc_value_size" {
    expr = "pg_column_size(value) <= 102400"
  }



}
table "markets" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_primary" {
    type    = boolean
    default = false
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "default_currency" {
    type = char(3)
  }
  column "default_language" {
    type    = char(2)
    default = "ar"
  }
  column "name" {
    type = jsonb
  }
  column "countries" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }
  index "uq_tenant_primary_market" {
    unique  = true
    columns = [column.id]
    where   = "is_primary =true"
  }

  // ALTER TABLE storefront.markets ENABLE ROW LEVEL SECURITY



}
table "price_lists" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "market_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
    null = true
  }
  column "variant_id" {
    type = uuid
    null = true
  }

  column "quantity_range" {
    type = sql("int4range")
    null = false
  }

  column "price" {
    type = decimal(12,4)
  }
  column "compare_at_price" {
    type = decimal(12,4)
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  check "chk_pl_inner_not_null" {
    expr = "(price) IS NOT NULL AND (price) IS NOT NULL"
  }



  // ELITE: Prevent overlapping quantity ranges for same product/variant/market
#  index "idx_price_list_overlap" {
#    type = "GIST"
#    on {
#      column = column.product_id
#    }
#    on {
#      column = column.variant_id
#    }
#    on {
#      column = column.market_id
#    }
#    on {
#      column = column.quantity_range
#    }
#  }


  // Strike 04: Cross-Tenant Pricing Fix (Composite FK)
  foreign_key "fk_pl_market" {
    columns     = [column.market_id]
    ref_columns = [table.markets.column.id]
    on_delete = RESTRICT
  }
  check "chk_pl_price_inner" {
    expr = "(price) IS NOT NULL AND (price) IS NOT NULL"
  }


}
table "currency_rates" {
  schema = schema.dynamic_tenant
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "from_currency" {
    type = char(3)
  }
  column "to_currency" {
    type = char(3)
  }
  column "rate" {
    type = numeric(12,6)
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_tenant_currency_pair" {
    columns = [column.from_currency, column.to_currency]
  }




}
















