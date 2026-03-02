// ==========================================
// APEX V2 - 2026 ENTERPRISE ARCHITECTURE (ATLAS HCL)
// DIRECTIVE: EXECUTIVE OVERRIDE (ATLAS-2026-01)
// STATUS: FINAL | SECURITY: ZERO-TOLERANCE
// MODULE: 03_COMMERCE_CRM (Transactional & Users)
// ==========================================

table "customers" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
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
  unique "uq_tenant_customer" {
    columns = [column.tenant_id, column.id]
  }
  index "idx_customer_email_hash" {
    unique  = true
    columns = [column.tenant_id, column.email_hash]
    where   = "deleted_at IS NULL"
  }
  index "idx_customer_phone_hash" {
    unique  = true
    columns = [column.tenant_id, column.phone_hash]
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
  index "idx_customers_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.customers ENABLE ROW LEVEL SECURITY
}
table "customer_addresses" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    type = sql("public.geography(point, 4326)")
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_customer_addresses_customer" {
    columns = [column.customer_id]
  }
  index "idx_customer_addresses_geo" {
    columns = [column.coordinates]
    type = "GIST"
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
  index "idx_customer_addresses_tenant" {
    columns = [column.tenant_id]
  }
  // Strike 10: Prevent default address spam (one default per customer/tenant)
  index "uq_cust_default_addr" {
    unique  = true
    columns = [column.tenant_id, column.customer_id]
    where   = "is_default = true"
  }

  // ALTER TABLE storefront.customer_addresses ENABLE ROW LEVEL SECURITY
  foreign_key "fk_addr_cust" {
    columns     = [column.tenant_id, column.customer_id]
    ref_columns = [table.customers.column.tenant_id, table.customers.column.id]
    on_delete = RESTRICT
  }
}
table "customer_consents" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_customer_consents_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.customer_consents ENABLE ROW LEVEL SECURITY
  foreign_key "fk_consent_cust" {
    columns     = [column.tenant_id, column.customer_id]
    ref_columns = [table.customers.column.tenant_id, table.customers.column.id]
    on_delete = RESTRICT
  }
}
table "customer_segments" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_customer_segments_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.customer_segments ENABLE ROW LEVEL SECURITY
}
table "orders" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  unique "uq_tenant_order" {
    columns = [column.tenant_id, column.id]
  }
  index "idx_orders_number_active" {
    unique  = true
    columns = [column.tenant_id, column.order_number]
    where   = "deleted_at IS NULL"
  }
  index "idx_orders_idempotency" {
    unique  = true
    columns = [column.tenant_id, column.idempotency_key]
    where   = "idempotency_key IS NOT NULL"
  }

  // Strike 09: Payment Gateway Reference (Stripe Intent/Reference)
  column "payment_gateway_reference" {
    type = varchar(255)
    null = true
  }
  index "idx_orders_payment_ref" {
    columns = [column.tenant_id, column.payment_gateway_reference]
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
    expr = "(COALESCE((total), 0) = COALESCE((subtotal), 0) + COALESCE((tax), 0) + COALESCE((shipping), 0) - COALESCE((discount), 0) - COALESCE((coupon_discount), 0))"
  }
  check "chk_positive_costs" {
    expr = "(COALESCE((shipping), 0) >= 0 AND COALESCE((tax), 0) >= 0)"
  }
  check "chk_refund_cap" {
    expr = "COALESCE((refunded_amount), 0) <= COALESCE((total), 0)"
  }
  index "idx_orders_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.orders ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ord_customer" {
    columns     = [column.tenant_id, column.customer_id]
    ref_columns = [table.customers.column.tenant_id, table.customers.column.id]
    on_delete = RESTRICT
  }
}
table "order_items" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns = [column.tenant_id, column.product_id]
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
  index "idx_order_items_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.order_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_oi_order" {
    columns     = [column.tenant_id, column.order_id]
    ref_columns = [table.orders.column.tenant_id, table.orders.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_oi_variant" {
    columns     = [column.tenant_id, column.variant_id]
    ref_columns = [table.product_variants.column.tenant_id, table.product_variants.column.id]
    on_delete = RESTRICT
  }
}
table "order_edits" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_order_edits_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.order_edits ENABLE ROW LEVEL SECURITY
  foreign_key "fk_oe_order" {
    columns     = [column.tenant_id, column.order_id]
    ref_columns = [table.orders.column.tenant_id, table.orders.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_oe_line_item" {
    columns     = [column.line_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }
}
table "order_timeline" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_order_timeline_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.order_timeline ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ot_order" {
    columns     = [column.tenant_id, column.order_id]
    ref_columns = [table.orders.column.tenant_id, table.orders.column.id]
    on_delete = RESTRICT
  }
}
table "fulfillments" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_fulfillments_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.fulfillments ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ful_order" {
    columns     = [column.tenant_id, column.order_id]
    ref_columns = [table.orders.column.tenant_id, table.orders.column.id]
    on_delete = RESTRICT
  }
}
table "fulfillment_items" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_fulfillment_items_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.fulfillment_items ENABLE ROW LEVEL SECURITY
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
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  unique "uq_tenant_refund" {
    columns = [column.tenant_id, column.id]
  }
  index "idx_refunds_order" {
    columns = [column.order_id]
  }
  check "chk_refund_positive" {
    expr = "COALESCE((amount), 0) > 0"
  }
  index "idx_refunds_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.refunds ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ref_order" {
    columns     = [column.tenant_id, column.order_id]
    ref_columns = [table.orders.column.tenant_id, table.orders.column.id]
    on_delete = RESTRICT
  }
}
table "refund_items" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_refund_items_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.refund_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ri_refund" {
    columns     = [column.tenant_id, column.refund_id]
    ref_columns = [table.refunds.column.tenant_id, table.refunds.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_ri_order_item" {
    columns     = [column.order_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }
}
table "rma_requests" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  unique "uq_tenant_rma" {
    columns = [column.tenant_id, column.id]
  }
  index "idx_rma_order" {
    columns = [column.order_id]
  }
  index "idx_rma_status" {
    columns = [column.status]
  }
  index "idx_rma_requests_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.rma_requests ENABLE ROW LEVEL SECURITY
  foreign_key "fk_rma_order" {
    columns     = [column.tenant_id, column.order_id]
    ref_columns = [table.orders.column.tenant_id, table.orders.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_rma_order_item" {
    columns     = [column.order_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }
}
table "rma_items" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_rma_items_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.rma_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_rmai_rma" {
    columns     = [column.tenant_id, column.rma_id]
    ref_columns = [table.rma_requests.column.tenant_id, table.rma_requests.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_rmai_order_item" {
    columns     = [column.order_item_id]
    ref_columns = [table.order_items.column.id]
    on_delete = RESTRICT
  }
}
table "payment_logs" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
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
  index "idx_payment_logs_order" {
    columns = [column.order_id]
  }
  index "idx_payment_logs_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.payment_logs ENABLE ROW LEVEL SECURITY
  foreign_key "fk_pl_order" {
    columns     = [column.tenant_id, column.order_id]
    ref_columns = [table.orders.column.tenant_id, table.orders.column.id]
    on_delete = RESTRICT
  }
}
table "carts" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  unique "uq_tenant_cart" {
    columns = [column.tenant_id, column.id]
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
  index "idx_carts_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.carts ENABLE ROW LEVEL SECURITY
  foreign_key "fk_cart_customer" {
    columns     = [column.tenant_id, column.customer_id]
    ref_columns = [table.customers.column.tenant_id, table.customers.column.id]
    on_delete = RESTRICT
  }
}
table "cart_items" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_cart_items_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.cart_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ci_cart" {
    columns     = [column.tenant_id, column.cart_id]
    ref_columns = [table.carts.column.tenant_id, table.carts.column.id]
    on_delete = CASCADE
  }
}
table "abandoned_checkouts" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_abandoned_items_gin" {
    columns = [column.items]
    type = "GIN"
  }
  index "idx_abandoned_checkouts_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.abandoned_checkouts ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ac_customer" {
    columns     = [column.tenant_id, column.customer_id]
    ref_columns = [table.customers.column.tenant_id, table.customers.column.id]
    on_delete = RESTRICT
  }
}

// 3. SHIPPING & TAX (Storefront)
// ==========================================
table "shipping_zones" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
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
  index "idx_shipping_zones_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.shipping_zones ENABLE ROW LEVEL SECURITY
}
table "tax_categories" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  unique "uq_tenant_tax_category" {
    columns = [column.tenant_id, column.id]
  }
  index "idx_tax_categories_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.tax_categories ENABLE ROW LEVEL SECURITY
}
table "tax_rules" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns            = [column.tenant_id, column.country, column.state, column.zip_code, column.tax_type]
}
  index "idx_tax_rules_country" {
    columns = [column.country]
  }
  check "chk_tax_rate_bounds" {
    expr = "(rate >= 0 AND rate <= 10000)"
  }
  index "idx_tax_rules_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.tax_rules ENABLE ROW LEVEL SECURITY
  foreign_key "fk_tr_tax_category" {
    columns     = [column.tenant_id, column.tax_category_id]
    ref_columns = [table.tax_categories.column.tenant_id, table.tax_categories.column.id]
    on_delete = RESTRICT
  }
}
table "reviews" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    type = text
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
  index "idx_reviews_tenant" {
    columns = [column.tenant_id]
  }
  index "idx_reviews_embedding_cosine" {
    on {
      column = column.embedding
      
    }
    type = "BTREE"

  }
}

// ==========================================
// ELITE SECURITY: FORCED RLS ACTIVATION 
// Protocol: RESTRICTIVE | Scope: STOREFRONT
// ==========================================








