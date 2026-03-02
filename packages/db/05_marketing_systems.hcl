// ==========================================
// APEX V2 - 2026 ENTERPRISE ARCHITECTURE (ATLAS HCL)
// DIRECTIVE: EXECUTIVE OVERRIDE (ATLAS-2026-01)
// STATUS: FINAL | SECURITY: ZERO-TOLERANCE
// MODULE: 04_MARKETING_SYSTEMS (Promotions, Apps, CMS & Analytics)
// ==========================================

// 1. PROMOTIONS & DISCOUNTS (Storefront)
// ==========================================
table "coupons" {
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
    type    = sql("public.money_amount")
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
    columns = [column.tenant_id, column.code]
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
    expr = "COALESCE((value).amount, 0) > 0"
  }
  check "chk_coupon_pct" {
    expr = "(type != 'percentage' OR COALESCE((value).amount, 0) <= 10000)"
  }
  check "chk_coupon_min_amount" {
    expr = "COALESCE((min_order_amount).amount, 0) >= 0"
  }
  index "idx_coupons_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.coupons ENABLE ROW LEVEL SECURITY
}

// Strike 03: Coupon Usage Tracking (Enforce max_uses_per_customer)
table "coupon_usages" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns = [column.tenant_id, column.coupon_id, column.customer_id, column.order_id]
  }
  index "idx_coupon_usages_lookup" {
    columns = [column.coupon_id, column.customer_id]
  }
  index "idx_coupon_usages_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.coupon_usages ENABLE ROW LEVEL SECURITY
  foreign_key "fk_cu_coupon" {
    columns     = [column.tenant_id, column.coupon_id]
    ref_columns = [table.coupons.column.tenant_id, table.coupons.column.id]
    on_delete = RESTRICT
  }
}
table "price_rules" {
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
  unique "uq_tenant_price_rule" {
    columns = [column.tenant_id, column.id]
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
  index "idx_price_rules_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.price_rules ENABLE ROW LEVEL SECURITY
}
table "discount_codes" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns = [column.tenant_id, column.code]
  }
  index "idx_discount_code" {
    columns = [column.code]
  }
  check "chk_code_strict" {
    expr = "( code =upper(code) AND code ~ '^[A-Z0-9_-]+$')"
  }
  index "idx_discount_codes_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.discount_codes ENABLE ROW LEVEL SECURITY
  foreign_key "fk_dc_price_rule" {
    columns     = [column.tenant_id, column.price_rule_id]
    ref_columns = [table.price_rules.column.tenant_id, table.price_rules.column.id]
    on_delete = RESTRICT
  }
}
table "flash_sales" {
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
  unique "uq_tenant_flash_sale" {
    columns = [column.tenant_id, column.id]
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
  index "idx_flash_sales_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.flash_sales ENABLE ROW LEVEL SECURITY
}
table "flash_sale_products" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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

  // Strike 5: Prevent product overlap in multiple flash sales via denormalized range
  column "valid_during" {
    type = sql("tstzrange")
    null = true
  }

  exclude "idx_flash_prod_overlap_prevent" {
    on {
      column = column.tenant_id
      op    = "="
    }
    on {
      column = column.product_id
      op    = "="
    }
    on {
      column = column.valid_during
      op    = "&&"
    }
    type = "GIST"
  }
  index "idx_flash_sale_products_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.flash_sale_products ENABLE ROW LEVEL SECURITY
  foreign_key "fk_fsp_flash_sale" {
    columns     = [column.tenant_id, column.flash_sale_id]
    ref_columns = [table.flash_sales.column.tenant_id, table.flash_sales.column.id]
    on_delete = RESTRICT
  }
}
table "product_bundles" {
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
  column "starts_at" {
    type = timestamptz
    null = true
  }
  column "ends_at" {
    type = timestamptz
    null = true
  }
  column "discount_value" {
    type    = sql("public.money_amount")
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
  unique "uq_tenant_bundle" {
    columns = [column.tenant_id, column.id]
  }
  check "chk_bundle_discount_positive" {
    expr = "COALESCE((discount_value).amount, 0) >= 0"
  }
  index "idx_product_bundles_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.product_bundles ENABLE ROW LEVEL SECURITY
}
table "product_bundle_items" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_product_bundle_items_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.product_bundle_items ENABLE ROW LEVEL SECURITY
  foreign_key "fk_pbi_bundle" {
    columns     = [column.tenant_id, column.bundle_id]
    ref_columns = [table.product_bundles.column.tenant_id, table.product_bundles.column.id]
    on_delete = RESTRICT
  }
}
table "loyalty_rules" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_loyalty_rules_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.loyalty_rules ENABLE ROW LEVEL SECURITY
}
table "wallet_transactions" {
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
    columns = [column.tenant_id, column.idempotency_key]
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
    expr = "COALESCE((balance_after).amount, 0) = COALESCE((balance_before).amount, 0) + COALESCE((amount).amount, 0)"
  }
  check "wallet_non_negative_balance" {
    expr = "COALESCE((balance_after).amount, 0) >= 0"
  }
  index "idx_wallet_transactions_tenant" {
    columns = [column.tenant_id]
  }
  // Strike 27: Immutable Wallet Transactions
  // Trigger logic: Prevent Update/Delete on this table (Mandatory for financial audit)
  // ALTER TABLE storefront.wallet_transactions ENABLE ROW LEVEL SECURITY
}
table "affiliate_partners" {
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
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "commission_rate" {
    type    = int
    default = 500
  }
  column "total_earned" {
    type    = sql("public.money_amount")
    default = 0.0000
  }
  column "total_paid" {
    type    = sql("public.money_amount")
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
  unique "uq_tenant_affiliate" {
    columns = [column.tenant_id, column.id]
  }
  unique "affiliate_partners_referral_code_unique" {
    columns = [column.tenant_id, column.referral_code]
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
  index "idx_affiliate_partners_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.affiliate_partners ENABLE ROW LEVEL SECURITY
}
table "affiliate_transactions" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    expr = "COALESCE((commission_amount).amount, 0) > 0"
  }
  index "idx_affiliate_transactions_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.affiliate_transactions ENABLE ROW LEVEL SECURITY
  foreign_key "fk_afftx_partner" {
    columns     = [column.tenant_id, column.partner_id]
    ref_columns = [table.affiliate_partners.column.tenant_id, table.affiliate_partners.column.id]
    on_delete = RESTRICT
  }
}

// 2. STAFF & RBAC (Storefront)
// ==========================================
table "staff_roles" {
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
  check "permissions_strict_keys" {
    expr = "(jsonb_typeof(permissions) = 'object' AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(permissions) AS k WHERE k NOT IN ('products', 'orders', 'customers', 'settings', 'promotions', 'analytics')))"
  }
  index "idx_staff_roles_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.staff_roles ENABLE ROW LEVEL SECURITY
}
table "staff_members" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  unique "uq_tenant_staff" {
    columns = [column.tenant_id, column.id]
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
  index "idx_staff_members_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.staff_members ENABLE ROW LEVEL SECURITY
  foreign_key "fk_sm_role" {
    columns     = [column.role_id]
    ref_columns = [table.staff_roles.column.id]
    on_delete = RESTRICT
  }
}
table "staff_sessions" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns = [column.tenant_id, column.token_hash]
  }
  index "idx_session_token" {
    columns = [column.token_hash]
    type = "HASH"
  }
  index "idx_session_active" {
    columns = [column.staff_id]
    where   = "revoked_at IS NULL"
  }
  index "idx_session_revocation_lookup" {
    columns = [column.staff_id, column.device_fingerprint, column.revoked_at]
  }
  foreign_key "fk_ss_tenant" {
    columns     = [column.tenant_id]
    ref_columns = [table.tenants.column.id]
    on_delete = RESTRICT
  }
  foreign_key "fk_ss_staff" {
    columns     = [column.tenant_id, column.staff_id]
    ref_columns = [table.staff_members.column.tenant_id, table.staff_members.column.id]
    on_delete = CASCADE
  }
}

// 3. APPS & EXTENSIBILITY (Storefront)
// ==========================================
table "app_installations" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  unique "uq_tenant_app" {
    columns = [column.tenant_id, column.id]
  }
  check "chk_app_key_s7" {
    expr = "(api_key IS NULL OR (jsonb_typeof(api_key) = 'object' AND api_key ? 'enc' AND api_key ? 'iv' AND api_key ? 'tag' AND api_key ? 'data'))"
  }
  check "chk_app_token_s7" {
    expr = "(access_token IS NULL OR (jsonb_typeof(access_token) = 'object' AND access_token ? 'enc' AND access_token ? 'iv' AND access_token ? 'tag' AND access_token ? 'data'))"
  }
  index "idx_app_installations_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.app_installations ENABLE ROW LEVEL SECURITY
}
table "webhook_subscriptions" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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

  // SECURITY: App layer MUST block private/local IPs in target_url to prevent SSRF
  column "target_url" {
    type = text
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
  check "chk_url_length" {
    expr = "(length(target_url) <= 2048)"
  }
  index "idx_webhook_subscriptions_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.webhook_subscriptions ENABLE ROW LEVEL SECURITY
  foreign_key "fk_ws_app" {
    columns     = [column.tenant_id, column.app_id]
    ref_columns = [table.app_installations.column.tenant_id, table.app_installations.column.id]
    on_delete = RESTRICT
  }
}

// 4. CMS & CONTENT (Storefront)
// ==========================================
table "pages" {
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
    columns = [column.tenant_id, column.slug]
    where   = "deleted_at IS NULL"
  }
  index "idx_pages_published" {
    columns = [column.is_published]
  }
  check "chk_page_slug" {
    expr = "(slug ~ '^[a-z0-9-]+$')"
  }
  index "idx_pages_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.pages ENABLE ROW LEVEL SECURITY
}
table "blog_posts" {
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
  column "category" {
    type = varchar(100)
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
    columns = [column.tenant_id, column.slug]
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
  index "idx_blog_posts_tenant" {
    columns = [column.tenant_id]
  }


  // ALTER TABLE storefront.blog_posts ENABLE ROW LEVEL SECURITY
}
table "legal_pages" {
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
    columns = [column.tenant_id, column.page_type]
  }
  index "idx_legal_tenant" {
    columns = [column.tenant_id]
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
  index "idx_legal_pages_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.legal_pages ENABLE ROW LEVEL SECURITY
}
table "faq_categories" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_faq_categories_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.faq_categories ENABLE ROW LEVEL SECURITY
}
table "faqs" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
  index "idx_faqs_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.faqs ENABLE ROW LEVEL SECURITY
  foreign_key "fk_faq_category" {
    columns     = [column.category_id]
    ref_columns = [table.faq_categories.column.id]
    on_delete = SET_NULL
  }
}
table "kb_categories" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns = [column.tenant_id, column.slug]
  }
  index "idx_kb_categories_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.kb_categories ENABLE ROW LEVEL SECURITY
}
table "kb_articles" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns = [column.tenant_id, column.slug]
  }
  index "idx_kb_article_slug" {
    columns = [column.slug]
  }
  index "idx_kb_articles_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.kb_articles ENABLE ROW LEVEL SECURITY
  foreign_key "fk_kba_category" {
    columns     = [column.category_id]
    ref_columns = [table.kb_categories.column.id]
    on_delete = RESTRICT
  }
}
table "banners" {
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
  index "idx_banners_tenant" {
    columns = [column.tenant_id]
  }
  index "idx_banners_active" {
    columns = [column.is_active, column.location]
  }
}
table "announcement_bars" {
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
  index "idx_announcements_tenant" {
    columns = [column.tenant_id]
  }
}
table "popups" {
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
  index "idx_popups_tenant" {
    columns = [column.tenant_id]
  }
}
table "search_synonyms" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "tenant_id" {
    type = uuid
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
    columns = [column.tenant_id, column.term]
  }
  check "chk_synonym_no_self_loop" {
    expr = "NOT (synonyms ? term)"
  }
}

// Requires pg_partman retention policy: 90 days.
table "product_views" {
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
  index "idx_pv_tenant" {
    columns = [column.tenant_id]
  }
  index "idx_product_views_tenant" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.product_views ENABLE ROW LEVEL SECURITY
}








