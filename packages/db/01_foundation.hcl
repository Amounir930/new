// ==========================================
// APEX V2 - 2026 ENTERPRISE ARCHITECTURE (ATLAS HCL)
// DIRECTIVE: EXECUTIVE OVERRIDE (ATLAS-2026-01)
// STATUS: FINAL | SECURITY: ZERO-TOLERANCE
// MODULE: 01_FOUNDATION (Core & Governance)
// ==========================================

schema "public" {}
schema "governance" {}
schema "storefront" {}
schema "vault" {}
schema "shared" {}
schema "legacy" {}

extension "postgis"    { schema = schema.public }
extension "pg_trgm"    { schema = schema.public }
extension "vector"     { schema = schema.public }
extension "pg_partman" { schema = schema.public }
extension "pgcrypto"   { schema = schema.public }
extension "ltree"      { schema = schema.public }
extension "btree_gist" { schema = schema.public }

function "gen_ulid" {
  schema = schema.public
  lang   = "plpgsql"
  return = "uuid"
  as     = <<SQL
DECLARE
  v_time bytea;
  v_rnd  bytea;
BEGIN
  -- ULID format (128 bits): 48-bit timestamp + 80-bit randomness
  -- 1,000,000 multiplier for true Microsecond Precision
  v_time := decode(lpad(to_hex(floor(extract(epoch from clock_timestamp()) * 1000000)::bigint), 12, '0'), 'hex');
  v_rnd  := gen_random_bytes(10);
  RETURN (encode(v_time || v_rnd, 'hex'))::uuid;
END;
SQL
}

function "set_current_timestamp_updated_at" {
  schema = schema.public
  lang   = "plpgsql"
  return = "trigger"
  as     = <<SQL
BEGIN
  -- ELITE: Support manual overrides for audit/migration purposes
  IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at := clock_timestamp();
  END IF;
  RETURN NEW;
END;
SQL
}

function "prevent_tenant_hijacking" {
  schema = schema.public
  lang   = "plpgsql"
  return = "trigger"
  as     = <<SQL
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Security Breach: Tenant ID modification is strictly forbidden' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
SQL
}

function "validate_price_currency" {
  schema = schema.public
  lang   = "plpgsql"
  return = "trigger"
  as     = <<SQL
BEGIN
  IF (NEW.price).currency IS NULL OR (NEW.price).currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Data Integrity Violation: Invalid currency format in price' USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END;
SQL
}

composite_type "money_amount" {
  schema = schema.public
  field "amount"   { type = bigint }
  field "currency" { type = char(3) }
}

// ELITE DIRECTIVE: Application-level role configuration activated via sql.elite_server_config

enum "severity_enum" { schema = schema.public values = ["INFO", "WARNING", "CRITICAL", "SECURITY_ALERT"] }
enum "audit_result_enum" { schema = schema.public values = ["SUCCESS", "FAILURE"] }
enum "tenant_plan" { schema = schema.public values = ["free", "basic", "pro", "enterprise"] }
enum "tenant_status" { schema = schema.public values = ["active", "suspended", "pending", "archived"] }
enum "tenant_niche" { schema = schema.public values = ["retail", "wellness", "education", "services", "hospitality", "real-estate", "creative"] }
// FIX (P1): Enterprise B2B lifecycle added
enum "order_status" { schema = schema.public values = ["draft", "awaiting_approval", "pending", "processing", "shipped", "delivered", "cancelled", "returned"] }
enum "payment_status" { schema = schema.public values = ["pending", "paid", "partially_refunded", "refunded", "failed"] }
enum "payment_method" { schema = schema.public values = ["card", "cod", "wallet", "bnpl", "bank_transfer"] }
enum "fulfillment_status" { schema = schema.public values = ["pending", "shipped", "in_transit", "delivered", "failed"] }
enum "order_source" { schema = schema.public values = ["web", "mobile", "b2b", "pos"] }
enum "discount_type" { schema = schema.public values = ["percentage", "fixed", "buy_x_get_y", "free_shipping"] }
enum "discount_applies_to" { schema = schema.public values = ["all", "specific_products", "specific_categories", "specific_customers"] }
enum "rma_status" { schema = schema.public values = ["requested", "approved", "shipped", "received", "completed", "rejected"] }
enum "rma_reason_code" { schema = schema.public values = ["defective", "wrong_item", "changed_mind", "not_as_described", "damaged_in_transit"] }
enum "rma_condition" { schema = schema.public values = ["new", "opened", "damaged"] }
enum "rma_resolution" { schema = schema.public values = ["refund", "exchange", "store_credit"] }
enum "refund_status" { schema = schema.public values = ["pending", "processed", "failed"] }
enum "inventory_movement_type" { schema = schema.public values = ["in", "out", "adjustment", "return", "transfer"] }
enum "reservation_status" { schema = schema.public values = ["active", "converted", "expired"] }
enum "transfer_status" { schema = schema.public values = ["draft", "in_transit", "received", "cancelled"] }
enum "location_type" { schema = schema.public values = ["warehouse", "retail", "dropship"] }
enum "purchase_order_status" { schema = schema.public values = ["draft", "ordered", "partial", "received", "cancelled"] }
enum "invoice_status" { schema = schema.public values = ["draft", "issued", "paid", "overdue"] }
enum "lead_status" { schema = schema.public values = ["new", "contacted", "qualified", "converted"] }
enum "dunning_status" { schema = schema.public values = ["pending", "retried", "failed", "recovered"] }
enum "outbox_status" { schema = schema.public values = ["pending", "processing", "completed", "failed"] }
enum "affiliate_status" { schema = schema.public values = ["active", "pending", "suspended"] }
enum "affiliate_tx_status" { schema = schema.public values = ["pending", "approved", "paid", "rejected"] }
enum "b2b_company_status" { schema = schema.public values = ["active", "pending", "suspended"] }
enum "b2b_user_role" { schema = schema.public values = ["admin", "buyer", "viewer"] }
enum "consent_channel" { schema = schema.public values = ["email", "sms", "push", "whatsapp"] }
enum "actor_type" { schema = schema.public values = ["super_admin", "tenant_admin", "system"] }
enum "blueprint_status" { schema = schema.public values = ["active", "paused"] }

table "encryption_keys" {
  schema        = schema.vault
  column "id"           { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "tenant_id"     { type = uuid }
  column "created_at"    { type = timestamptz default = sql("now()") }
  column "rotated_at"    { type = timestamptz null = true }
  column "expires_at"    { type = timestamptz null = true }
  column "key_version"   { type = int default = 1 }
  column "is_active"     { type = boolean default = true }
  column "algorithm"     { type = varchar(20) default = "AES-256-GCM" }
  // Strike 16: Key Fingerprint for forensic tracking
  column "key_fingerprint" { type = varchar(64) null = true }
  column "key_material"  { type = jsonb }
  primary_key { columns = [column.id] }
  check "chk_key_material_s7" { expr = "(key_material IS NULL OR (jsonb_typeof(key_material) = 'object' AND key_material ? 'enc' AND key_material ? 'iv' AND key_material ? 'tag' AND key_material ? 'data'))" }
  index "idx_encryption_keys_tenant" { columns = [column.tenant_id] }
}

table "archival_vault" {
  schema         = schema.vault
  column "id"            { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "table_name"    { type = text }
  column "original_id"   { type = text }
  column "tenant_id"     { type = uuid }
  column "deleted_at"    { type = timestamptz default = sql("now()") }
  column "deleted_by"    { type = text }
  column "payload"       { type = jsonb }
  column "tombstone_hash" { type = text }
  primary_key { columns = [column.id] }
  check "chk_payload_size" { expr = "(pg_column_size(payload) <= 102400)" }
}

table "tenants" {
  schema               = schema.governance
  column "id"                { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "created_at"        { type = timestamptz default = sql("now()") }
  column "updated_at"        { type = timestamptz default = sql("now()") }
  column "deleted_at"        { type = timestamptz null = true }
  column "trial_ends_at"     { type = timestamptz null = true }
  column "suspended_at"      { type = timestamptz null = true }
  column "plan"              { type = enum.tenant_plan default = "free" }
  column "status"            { type = enum.tenant_status default = "active" }
  column "subdomain"         { type = text }
  column "custom_domain"     { type = text null = true }
  column "name"              { type = text }
  column "owner_email"       { type = jsonb null = true }
  column "owner_email_hash"  { type = text null = true }
  column "suspended_reason"  { type = text null = true }
  column "niche_type"        { type = text default = "retail" }
  column "niche_type_hash"   { type = text null = true }
  column "ui_config"         { type = jsonb default = sql("'{}'::jsonb") }
  column "data_region"       { type = char(2) default = "SA" } 
  column "timezone"          { type = varchar(50) default = "UTC" }

  primary_key { columns = [column.id] }
  unique "tenants_subdomain_unique" { columns = [column.subdomain] where = "deleted_at IS NULL" }
  unique "tenants_custom_domain_unique" { columns = [column.custom_domain] where = "deleted_at IS NULL" }
  
  // FIX (P2): Index for Forensic Investigation AI
  index "idx_tenants_email_hash" { columns = [column.owner_email_hash] }

  check "chk_owner_email_s7" { expr = "(owner_email IS NULL OR (jsonb_typeof(owner_email) = 'object' AND owner_email ? 'enc' AND owner_email ? 'iv' AND owner_email ? 'tag' AND owner_email ? 'data'))" }
  check "chk_ui_config_size" { expr = "(pg_column_size(ui_config) <= 204800)" }
  
  // ELITE: RLS POLICY BASE
  // CREATE POLICY tenant_isolation ON storefront... USING (tenant_id = current_setting('app.current_tenant')::uuid);
}

table "audit_logs" {
  schema          = schema.governance
  column "id"             { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "created_at"     { type = timestamptz default = sql("now") null = false }
  column "severity"       { type = enum.severity_enum default = "INFO" }
  column "result"         { type = enum.audit_result_enum default = "SUCCESS" }
  column "tenant_id"      { type = uuid }
  column "actor_type"     { type = enum.actor_type default = "tenant_admin" }
  column "user_id"        { type = text null = true }
  column "user_email"     { type = jsonb null = true }
  column "action"         { type = text }
  column "public_key"    { type = text }
  column "encrypted_key" { type = bytea null = false }
  column "version"       { type = int default = 1 }
  column "user_agent"     { type = text null = true }
  column "old_values"     { type = jsonb null = true }
  column "new_values"     { type = jsonb null = true }
  column "metadata"       { type = jsonb null = true }
  column "impersonator_id" { type = uuid null = true }
  column "checksum"       { type = text null = true }
  
  primary_key { columns = [column.id, column.created_at] }
  partition { type = RANGE columns = [column.created_at] }
  
  storage_param { name = "toast_tuple_target" value = "128" }
  index "idx_audit_created_brin" { columns = [column.created_at] using = BRIN }
  index "idx_audit_tenant" { columns = [column.tenant_id] }
  index "idx_audit_entity" { columns = [column.entity_type, column.entity_id] }
  index "idx_audit_action" { columns = [column.action] }
  check "chk_audit_json_size" { expr = "(pg_column_size(old_values) <= 102400 AND pg_column_size(new_values) <= 102400)" }
  check "chk_audit_email_s7" { 
    expr = "(user_email IS NULL OR (jsonb_typeof(user_email) = 'object' AND user_email ? 'enc' AND user_email ? 'iv' AND user_email ? 'tag' AND user_email ? 'data'))" 
  }
  // SECURITY (Feedback Loop): Ensure sensitive keys are NOT stored in plaintext within audit jsonb blocks
  check "chk_audit_sanitization" {
    expr = "(old_values IS NULL OR NOT (old_values ?| array['password', 'secret', 'token', 'cvv', 'card_number'])) AND (new_values IS NULL OR NOT (new_values ?| array['password', 'secret', 'token', 'cvv', 'card_number']))"
  }
}


table "leads" {
  schema               = schema.governance
  column "id"                 { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "created_at"         { type = timestamptz default = sql("now()") }
  // Strike 21: AI Lead Scoring for sales prioritization
  column "lead_score"          { type = int null = true }
  column "converted_tenant_id" { type = uuid null = true }
  column "status"             { type = enum.lead_status default = "new" }
  column "email"              { type = jsonb }
  column "email_hash"         { type = text }
  
  // FIX (P2): Encrypting AI Training Sales Data PII
  column "name"               { type = jsonb null = true }
  column "notes"              { type = jsonb null = true }
  
  column "source"             { type = varchar(50) null = true }
  column "landing_page_url"   { type = text null = true }
  column "utm_source"         { type = varchar(100) null = true }
  column "utm_medium"         { type = varchar(100) null = true }
  column "utm_campaign"       { type = varchar(100) null = true }
  column "tags"               { type = jsonb default = sql("'[]'::jsonb") }
  
  primary_key { columns = [column.id] }
  index "idx_leads_email_hash" { columns = [column.email_hash] }
  index "idx_leads_status" { columns = [column.status] }
  index "idx_leads_converted" { columns = [column.converted_tenant_id] }
  
  check "chk_leads_email_s7" { expr = "(email IS NULL OR (jsonb_typeof(email) = 'object' AND email ? 'enc' AND email ? 'iv' AND email ? 'tag' AND email ? 'data'))" }
  check "chk_leads_name_s7" { expr = "(name IS NULL OR (jsonb_typeof(name) = 'object' AND name ? 'enc' AND name ? 'iv' AND name ? 'tag' AND name ? 'data'))" }
  check "chk_leads_notes_s7" { expr = "(notes IS NULL OR (jsonb_typeof(notes) = 'object' AND notes ? 'enc' AND notes ? 'iv' AND notes ? 'tag' AND notes ? 'data'))" }
  
  index "idx_leads_tenant" { columns = [column.converted_tenant_id] }
}

table "subscription_plans" {
  schema               = schema.governance
  column "id"                     { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "created_at"             { type = timestamptz default = sql("now()") }
  column "updated_at"             { type = timestamptz default = sql("now()") }
  column "price_monthly"          { type = bigint }
  column "price_yearly"           { type = bigint }
  column "default_max_products"   { type = int default = 50 }
  column "default_max_orders"     { type = int default = 100 }
  column "default_max_pages"      { type = int default = 5 }
  column "default_max_staff"      { type = int default = 3 }
  column "default_max_storage_gb" { type = int default = 1 }
  column "sort_order"             { type = int default = 0 }
  column "is_active"              { type = boolean default = true }
  column "code"                   { type = varchar(50) }
  column "name"                   { type = varchar(100) }
  column "currency"               { type = varchar(3) default = "USD" }
  column "description"            { type = text null = true }
  primary_key { columns = [column.id] }
  unique "subscription_plans_code_unique" { columns = [column.code] }
  // ELITE: money_amount used for pricing
  column "price_monthly_v2" { type = sql("public.money_amount") null = false }
  column "price_yearly_v2"  { type = sql("public.money_amount") null = false }
  check "chk_plan_price" { expr = "COALESCE((price_monthly_v2).amount, 0) >= 0 AND COALESCE((price_yearly_v2).amount, 0) >= 0" }
}

table "tenant_quotas" {
  schema            = schema.governance
  column "id"               { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "tenant_id"        { type = uuid }
  column "updated_at"       { type = timestamptz default = sql("now()") }
  column "max_products"     { type = int null = true }
  column "max_orders"       { type = int null = true }
  column "max_pages"        { type = int null = true }
  column "max_staff"        { type = int null = true }
  column "max_categories"   { type = int null = true }
  column "max_coupons"      { type = int null = true }
  column "storage_limit_gb" { type = int default = 1 }
  column "api_rate_limit"   { type = int null = true }
  primary_key { columns = [column.id] }
  index "idx_tenant_quotas_tenant" { columns = [column.tenant_id] }

}

table "tenant_invoices" {
  schema               = schema.governance
  column "id"                  { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "tenant_id"           { type = uuid }
  column "created_at"          { type = timestamptz default = sql("now()") }
  column "paid_at"             { type = timestamptz null = true }
  column "period_start"        { type = date }
  column "period_end"          { type = date }
  column "subscription_amount" { type = sql("public.money_amount") default = sql("ROW(0, 'USD')::public.money_amount") }
  column "platform_commission" { type = sql("public.money_amount") default = sql("ROW(0, 'USD')::public.money_amount") }
  column "app_charges"         { type = sql("public.money_amount") default = sql("ROW(0, 'USD')::public.money_amount") }
  column "total"               { type = sql("public.money_amount") null = false }
  column "status"              { type = enum.invoice_status default = "draft" }
  column "currency"            { type = char(3) default = "USD" }
  column "pdf_url"             { type = text null = true }
  primary_key { columns = [column.id] }
  check "chk_invoice_period" { expr = "period_end >= period_start" }
  
  // ELITE: Directives Alpha & Bravo applied
  check "chk_invoice_math" { 
    expr = "COALESCE((total).amount, 0) = COALESCE((subscription_amount).amount, 0) + COALESCE((platform_commission).amount, 0) + COALESCE((app_charges).amount, 0)" 
  }
  
  index "idx_invoices_tenant" { columns = [column.tenant_id] }
  index "idx_invoices_status" { columns = [column.status] }
  index "idx_tenant_invoices_tenant" { columns = [column.tenant_id] }

}

table "feature_gates" {
  schema          = schema.governance
  column "id"          { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "tenant_id"   { type = uuid null = true }
  column "created_at"  { type = timestamptz default = sql("now()") }
  column "is_enabled"  { type = boolean default = false }
  column "plan_code"   { type = varchar(50) null = true }
  column "feature_key" { type = varchar(100) }
  // Strike 26: Percent-based rollouts for Canary Releases
  column "rollout_percentage" { type = int default = 100 }
  column "metadata"    { type = jsonb null = true }
  
  check "chk_rollout_range" { expr = "rollout_percentage >= 0 AND rollout_percentage <= 100" }
  primary_key { columns = [column.id] }
  unique "uq_feature_tenant_key" { columns = [column.tenant_id, column.feature_key] }
  
  // FIX (P2): OOM Bomb Protection for Metadata
  check "chk_fg_meta_size" { expr = "pg_column_size(metadata) <= 51200" }
  
  index "idx_feature_key" { columns = [column.feature_key] }
  index "idx_feature_tenant" { columns = [column.tenant_id] }
  index "idx_feature_gates_tenant" { columns = [column.tenant_id] }

}

table "dunning_events" {
  schema          = schema.governance
  column "id"             { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "tenant_id"      { type = uuid }
  column "created_at"     { type = timestamptz default = sql("now()") }
  column "attempt_number" { type = int default = 1 }
  column "status"         { type = enum.dunning_status default = "pending" }
  column "amount"         { type = sql("public.money_amount") null = false }
  column "next_retry_at"  { type = timestamptz null = true }
  column "payment_method" { type = text null = true }
  column "error_message"  { type = text null = true }
  primary_key { columns = [column.id] }
  check "chk_dunning_attempts" { expr = "(attempt_number <= 5)" }
  check "chk_dunning_amount" { expr = "COALESCE((amount).amount, 0) > 0" }
  index "idx_dunning_events_tenant" { columns = [column.tenant_id] }

}

table "app_usage_records" {
  schema          = schema.governance
  column "id"         { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "tenant_id"  { type = uuid }
  column "created_at" { type = timestamptz default = sql("now()") }
  column "app_id"     { type = uuid }
  column "quantity"   { type = int }
  column "unit_price" { type = sql("public.money_amount") }
  column "currency"   { type = char(3) default = "USD" } 
  column "metric"     { type = varchar(50) }
  primary_key { columns = [column.id] }
  index "idx_app_usage_records_tenant" { columns = [column.tenant_id] }

}

table "plan_change_history" {
  schema          = schema.governance
  column "id"         { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "tenant_id"  { type = uuid }
  column "created_at" { type = timestamptz default = sql("now()") }
  column "from_plan"  { type = varchar(50) }
  column "to_plan"    { type = varchar(50) }
  column "reason"     { type = text null = true }
  column "changed_by" { type = text }
  primary_key { columns = [column.id] }
  index "idx_plan_change_history_tenant" { columns = [column.tenant_id] }

}

table "onboarding_blueprints" {
  schema          = schema.governance
  column "id"           { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "created_at"   { type = timestamptz default = sql("now()") }
  column "updated_at"   { type = timestamptz default = sql("now()") }
  column "plan"         { type = enum.tenant_plan default = "free" }
  column "niche_type"   { type = enum.tenant_niche default = "retail" }
  column "status"       { type = enum.blueprint_status default = "active" }
  column "is_default"   { type = boolean default = false }
  column "name"         { type = text }
  column "description"  { type = text null = true }
  column "blueprint"    { type = jsonb }
  column "ui_config"    { type = jsonb default = sql("'{}'::jsonb") }
  primary_key { columns = [column.id] }
  index "blueprint_niche_plan_idx" { columns = [column.niche_type, column.plan] }
}

table "system_config" {
  schema          = schema.governance
  column "key"        { type = varchar(100) }
  column "updated_at" { type = timestamptz default = sql("now()") }
  column "value"      { type = jsonb }
  primary_key { columns = [column.key] }
}

table "schema_drift_log" {
  schema             = schema.governance
  column "id"              { type = uuid default = sql("gen_random_uuid()::uuid") }
  column "command_tag"     { type = text null = true }
  column "object_type"     { type = text null = true }
  column "object_identity" { type = text null = true }
  column "actor_id"        { type = text null = true }
  // Strike 19: Forensic Analysis Columns for Schema Drift
  column "ip_address"      { type = inet null = true }
  column "user_agent"      { type = text null = true }
  column "executed_at"     { type = timestamptz default = sql("now()") }
  primary_key { columns = [column.id] }
  index "idx_drift_time" { columns = [column.executed_at] using = BRIN }
}

table "order_fraud_scores" {
  schema          = schema.governance
  column "id"           { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "order_id"     { type = uuid }
  column "tenant_id"    { type = uuid }
  column "created_at"   { type = timestamptz default = sql("now()") }
  column "risk_score"   { type = int }
  column "is_flagged"   { type = boolean default = false }
  column "is_reviewed"  { type = boolean default = false }
  column "reviewed_by"  { type = text null = true }
  column "decision"     { type = text null = true }
  column "provider"     { type = text default = "internal" }
  // Strike 28: Model Versioning for Fraud Detection
  column "ml_model_version" { type = varchar(50) default = "v1.0.0" }
  column "signals"      { type = jsonb default = sql("'{}'::jsonb") }
  primary_key { columns = [column.id] }
  check "chk_risk_score_range" { expr = "(risk_score BETWEEN 0 AND 1000)" }
  index "idx_fraud_order" { columns = [column.order_id] }
  index "idx_fraud_tenant" { columns = [column.tenant_id] }
  index "idx_fraud_flagged" { columns = [column.is_flagged] where = "is_flagged = true AND is_reviewed = false" }
  
  index "idx_order_fraud_scores_tenant" { columns = [column.tenant_id] }

}

table "marketing_pages" {
  schema               = schema.governance
  column "id"                { type = uuid default = sql("public.gen_ulid()::uuid") }
  column "created_at"        { type = timestamptz default = sql("now()") }
  column "updated_at"        { type = timestamptz default = sql("now()") }
  column "published_at"      { type = timestamptz null = true }
  column "is_published"      { type = boolean default = false }
  column "slug"              { type = text }
  column "page_type"         { type = text default = "landing" }
  column "meta_title"        { type = text null = true }
  column "meta_description"  { type = text null = true }
  column "created_by"        { type = text null = true }
  column "title"             { type = jsonb }
  column "content"           { type = jsonb }
  primary_key { columns = [column.id] }
  unique "uq_marketing_slug" { columns = [column.slug] }
  index "idx_mkt_slug" { columns = [column.slug] }
  index "idx_mkt_published" { columns = [column.is_published] }
  index "idx_mkt_type" { columns = [column.page_type] }
}

// ==========================================
// ELITE INFRASTRUCTURE: ENGINE HARDENING
// Protocols: DoS Protection & WAL Safety
// ==========================================
sql "elite_server_config" {
  exec = <<SQL
ALTER ROLE app_user SET statement_timeout = '5000ms';
ALTER ROLE app_user SET lock_timeout = '2000ms';
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_slot_wal_keep_size = '2048MB';
SQL
}

sql "init_partman" {
  depends_on = [table.audit_logs, table.outbox_events]
  exec = <<SQL
  -- Initialize Partman for Audit Logs (Monthly)
  SELECT partman.create_parent('governance.audit_logs', 'created_at', 'native', 'monthly');
  -- Initialize Partman for Outbox (Daily)
  SELECT partman.create_parent('storefront.outbox_events', 'created_at', 'native', 'daily');
  SQL
}

sql "enforce_app_user_limits" {
  exec = <<SQL
  ALTER ROLE app_user NOBYPASSRLS;
  SQL
}
