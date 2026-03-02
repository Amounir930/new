-- Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_partman" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "ltree" SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "btree_gist" SCHEMA "public";


-- Required Custom Functions
CREATE OR REPLACE FUNCTION public.gen_ulid() RETURNS uuid
LANGUAGE plpgsql
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- ELITE: Support manual overrides for audit/migration purposes
  IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at := clock_timestamp();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_tenant_hijacking() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Security Breach: Tenant ID modification is strictly forbidden' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_price_currency() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
IF (NEW.price).currency IS NULL OR (NEW.price).currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Data Integrity Violation: Invalid currency format in price' USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END;
$$;


-- Add new schema named "storefront"
CREATE SCHEMA "storefront";
-- Create "pages" table
CREATE TABLE "storefront"."pages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "is_published" boolean NOT NULL DEFAULT false,
  "slug" character varying(255) NOT NULL,
  "page_type" character varying(50) NOT NULL DEFAULT 'custom',
  "template" character varying(50) NOT NULL DEFAULT 'default',
  "meta_title" character varying(70) NULL,
  "meta_description" character varying(160) NULL,
  "title" jsonb NOT NULL,
  "content" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_pages_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_page_slug" CHECK ((slug)::text ~ '^[a-z0-9-]+$'::text)
);
-- Create index "idx_pages_published" to table: "pages"
CREATE INDEX "idx_pages_published" ON "storefront"."pages" ("is_published");
-- Create index "idx_pages_slug_active" to table: "pages"
CREATE UNIQUE INDEX "idx_pages_slug_active" ON "storefront"."pages" ("tenant_id", "slug") WHERE (deleted_at IS NULL);
-- Create index "idx_pages_tenant" to table: "pages"
CREATE INDEX "idx_pages_tenant" ON "storefront"."pages" ("tenant_id");
-- Add new schema named "public"
CREATE SCHEMA IF NOT EXISTS "public";
-- Set comment to schema: "public"
COMMENT ON SCHEMA "public" IS 'standard public schema';
-- Create enum type "inventory_movement_type"
CREATE TYPE "public"."inventory_movement_type" AS ENUM ('in', 'out', 'adjustment', 'return', 'transfer');
-- Add new schema named "shared"
CREATE SCHEMA "shared";
-- Add new schema named "vault"
CREATE SCHEMA "vault";
-- Add new schema named "governance"
CREATE SCHEMA "governance";
-- Create "app_usage_records" table
CREATE TABLE "governance"."app_usage_records" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "app_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" numeric(12,4) NOT NULL,
  "currency" character(3) NOT NULL DEFAULT 'USD',
  "metric" character varying(50) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_app_usage_records_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_app_usage_records_tenant" to table: "app_usage_records"
CREATE INDEX "idx_app_usage_records_tenant" ON "governance"."app_usage_records" ("tenant_id");
-- Create enum type "severity_enum"
CREATE TYPE "public"."severity_enum" AS ENUM ('INFO', 'WARNING', 'CRITICAL', 'SECURITY_ALERT');
-- Create enum type "audit_result_enum"
CREATE TYPE "public"."audit_result_enum" AS ENUM ('SUCCESS', 'FAILURE');
-- Create enum type "actor_type"
CREATE TYPE "public"."actor_type" AS ENUM ('super_admin', 'tenant_admin', 'system');
-- Create "audit_logs" table
CREATE TABLE "governance"."audit_logs" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "severity" "public"."severity_enum" NOT NULL DEFAULT 'INFO',
  "result" "public"."audit_result_enum" NOT NULL DEFAULT 'SUCCESS',
  "tenant_id" uuid NOT NULL,
  "actor_type" "public"."actor_type" NOT NULL DEFAULT 'tenant_admin',
  "user_id" text NULL,
  "user_email" jsonb NULL,
  "entity_type" character varying(100) NULL,
  "entity_id" character varying(100) NULL,
  "action" text NOT NULL,
  "public_key" text NOT NULL,
  "encrypted_key" bytea NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "user_agent" text NULL,
  "old_values" jsonb NULL,
  "new_values" jsonb NULL,
  "metadata" jsonb NULL,
  "impersonator_id" uuid NULL,
  "checksum" text NULL,
  PRIMARY KEY ("id", "created_at"),
  CONSTRAINT "uq_tenant_audit_logs_composite" UNIQUE ("tenant_id", "id", "created_at"),
  CONSTRAINT "chk_audit_email_s7" CHECK ((user_email IS NULL) OR ((jsonb_typeof(user_email) = 'object'::text) AND (user_email ? 'enc'::text) AND (user_email ? 'iv'::text) AND (user_email ? 'tag'::text) AND (user_email ? 'data'::text))),
  CONSTRAINT "chk_audit_json_size" CHECK ((pg_column_size(old_values) <= 102400) AND (pg_column_size(new_values) <= 102400)),
  CONSTRAINT "chk_audit_sanitization" CHECK (((old_values IS NULL) OR (NOT (old_values ?| ARRAY['password'::text, 'secret'::text, 'token'::text, 'cvv'::text, 'card_number'::text]))) AND ((new_values IS NULL) OR (NOT (new_values ?| ARRAY['password'::text, 'secret'::text, 'token'::text, 'cvv'::text, 'card_number'::text]))))
) PARTITION BY RANGE ("created_at");
-- Create index "idx_audit_action" to table: "audit_logs"
CREATE INDEX "idx_audit_action" ON "governance"."audit_logs" ("action");
-- Create index "idx_audit_created_brin" to table: "audit_logs"
CREATE INDEX "idx_audit_created_brin" ON "governance"."audit_logs" USING BRIN ("created_at");
-- Create index "idx_audit_entity" to table: "audit_logs"
CREATE INDEX "idx_audit_entity" ON "governance"."audit_logs" ("entity_type", "entity_id");
-- Create index "idx_audit_tenant" to table: "audit_logs"
CREATE INDEX "idx_audit_tenant" ON "governance"."audit_logs" ("tenant_id");
-- Create enum type "dunning_status"
CREATE TYPE "public"."dunning_status" AS ENUM ('pending', 'retried', 'failed', 'recovered');
-- Create "dunning_events" table
CREATE TABLE "governance"."dunning_events" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "attempt_number" integer NOT NULL DEFAULT 1,
  "status" "public"."dunning_status" NOT NULL DEFAULT 'pending',
  "amount" numeric(12,4) NOT NULL,
  "next_retry_at" timestamptz NULL,
  "payment_method" text NULL,
  "error_message" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_dunning_events_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_dunning_amount" CHECK (COALESCE(amount, (0)::numeric) > (0)::numeric),
  CONSTRAINT "chk_dunning_attempts" CHECK (attempt_number <= 5)
);
-- Create index "idx_dunning_events_tenant" to table: "dunning_events"
CREATE INDEX "idx_dunning_events_tenant" ON "governance"."dunning_events" ("tenant_id");
-- Create "feature_gates" table
CREATE TABLE "governance"."feature_gates" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_enabled" boolean NOT NULL DEFAULT false,
  "plan_code" character varying(50) NULL,
  "feature_key" character varying(100) NOT NULL,
  "rollout_percentage" integer NOT NULL DEFAULT 100,
  "metadata" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_feature_tenant_key" UNIQUE ("tenant_id", "feature_key"),
  CONSTRAINT "uq_tenant_feature_gates_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_fg_meta_size" CHECK (pg_column_size(metadata) <= 51200),
  CONSTRAINT "chk_rollout_range" CHECK ((rollout_percentage >= 0) AND (rollout_percentage <= 100))
);
-- Create index "idx_feature_gates_tenant" to table: "feature_gates"
CREATE INDEX "idx_feature_gates_tenant" ON "governance"."feature_gates" ("tenant_id");
-- Create index "idx_feature_key" to table: "feature_gates"
CREATE INDEX "idx_feature_key" ON "governance"."feature_gates" ("feature_key");
-- Create index "idx_feature_tenant" to table: "feature_gates"
CREATE INDEX "idx_feature_tenant" ON "governance"."feature_gates" ("tenant_id");
-- Create enum type "lead_status"
CREATE TYPE "public"."lead_status" AS ENUM ('new', 'contacted', 'qualified', 'converted');
-- Create "leads" table
CREATE TABLE "governance"."leads" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "lead_score" integer NULL,
  "converted_tenant_id" uuid NULL,
  "status" "public"."lead_status" NOT NULL DEFAULT 'new',
  "email" jsonb NOT NULL,
  "email_hash" text NOT NULL,
  "name" jsonb NULL,
  "notes" jsonb NULL,
  "source" character varying(50) NULL,
  "landing_page_url" text NULL,
  "utm_source" character varying(100) NULL,
  "utm_medium" character varying(100) NULL,
  "utm_campaign" character varying(100) NULL,
  "tags" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "chk_leads_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
  CONSTRAINT "chk_leads_name_s7" CHECK ((name IS NULL) OR ((jsonb_typeof(name) = 'object'::text) AND (name ? 'enc'::text) AND (name ? 'iv'::text) AND (name ? 'tag'::text) AND (name ? 'data'::text))),
  CONSTRAINT "chk_leads_notes_s7" CHECK ((notes IS NULL) OR ((jsonb_typeof(notes) = 'object'::text) AND (notes ? 'enc'::text) AND (notes ? 'iv'::text) AND (notes ? 'tag'::text) AND (notes ? 'data'::text)))
);
-- Create index "idx_leads_converted" to table: "leads"
CREATE INDEX "idx_leads_converted" ON "governance"."leads" ("converted_tenant_id");
-- Create index "idx_leads_email_hash" to table: "leads"
CREATE INDEX "idx_leads_email_hash" ON "governance"."leads" ("email_hash");
-- Create index "idx_leads_status" to table: "leads"
CREATE INDEX "idx_leads_status" ON "governance"."leads" ("status");
-- Create index "idx_leads_tenant" to table: "leads"
CREATE INDEX "idx_leads_tenant" ON "governance"."leads" ("converted_tenant_id");
-- Create "marketing_pages" table
CREATE TABLE "governance"."marketing_pages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "published_at" timestamptz NULL,
  "is_published" boolean NOT NULL DEFAULT false,
  "slug" text NOT NULL,
  "page_type" text NOT NULL DEFAULT 'landing',
  "meta_title" text NULL,
  "meta_description" text NULL,
  "created_by" text NULL,
  "title" jsonb NOT NULL,
  "content" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_marketing_slug" UNIQUE ("slug")
);
-- Create index "idx_mkt_published" to table: "marketing_pages"
CREATE INDEX "idx_mkt_published" ON "governance"."marketing_pages" ("is_published");
-- Create index "idx_mkt_slug" to table: "marketing_pages"
CREATE INDEX "idx_mkt_slug" ON "governance"."marketing_pages" ("slug");
-- Create index "idx_mkt_type" to table: "marketing_pages"
CREATE INDEX "idx_mkt_type" ON "governance"."marketing_pages" ("page_type");
-- Create enum type "tenant_plan"
CREATE TYPE "public"."tenant_plan" AS ENUM ('free', 'basic', 'pro', 'enterprise');
-- Create enum type "tenant_niche"
CREATE TYPE "public"."tenant_niche" AS ENUM ('retail', 'wellness', 'education', 'services', 'hospitality', 'real-estate', 'creative');
-- Create enum type "blueprint_status"
CREATE TYPE "public"."blueprint_status" AS ENUM ('active', 'paused');
-- Create "onboarding_blueprints" table
CREATE TABLE "governance"."onboarding_blueprints" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "plan" "public"."tenant_plan" NOT NULL DEFAULT 'free',
  "niche_type" "public"."tenant_niche" NOT NULL DEFAULT 'retail',
  "status" "public"."blueprint_status" NOT NULL DEFAULT 'active',
  "is_default" boolean NOT NULL DEFAULT false,
  "name" text NOT NULL,
  "description" text NULL,
  "blueprint" jsonb NOT NULL,
  "ui_config" jsonb NOT NULL,
  PRIMARY KEY ("id")
);
-- Create index "blueprint_niche_plan_idx" to table: "onboarding_blueprints"
CREATE INDEX "blueprint_niche_plan_idx" ON "governance"."onboarding_blueprints" ("niche_type", "plan");
-- Create "order_fraud_scores" table
CREATE TABLE "governance"."order_fraud_scores" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "risk_score" integer NOT NULL,
  "is_flagged" boolean NOT NULL DEFAULT false,
  "is_reviewed" boolean NOT NULL DEFAULT false,
  "reviewed_by" text NULL,
  "decision" text NULL,
  "provider" text NOT NULL DEFAULT 'internal',
  "ml_model_version" character varying(50) NOT NULL DEFAULT 'v1.0.0',
  "signals" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_order_fraud_scores_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_risk_score_range" CHECK ((risk_score >= 0) AND (risk_score <= 1000))
);
-- Create index "idx_fraud_flagged" to table: "order_fraud_scores"
CREATE INDEX "idx_fraud_flagged" ON "governance"."order_fraud_scores" ("is_flagged") WHERE ((is_flagged = true) AND (is_reviewed = false));
-- Create index "idx_fraud_order" to table: "order_fraud_scores"
CREATE INDEX "idx_fraud_order" ON "governance"."order_fraud_scores" ("order_id");
-- Create index "idx_fraud_tenant" to table: "order_fraud_scores"
CREATE INDEX "idx_fraud_tenant" ON "governance"."order_fraud_scores" ("tenant_id");
-- Create index "idx_order_fraud_scores_tenant" to table: "order_fraud_scores"
CREATE INDEX "idx_order_fraud_scores_tenant" ON "governance"."order_fraud_scores" ("tenant_id");
-- Create "plan_change_history" table
CREATE TABLE "governance"."plan_change_history" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "from_plan" character varying(50) NOT NULL,
  "to_plan" character varying(50) NOT NULL,
  "reason" text NULL,
  "changed_by" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_plan_change_history_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_plan_change_history_tenant" to table: "plan_change_history"
CREATE INDEX "idx_plan_change_history_tenant" ON "governance"."plan_change_history" ("tenant_id");
-- Create "schema_drift_log" table
CREATE TABLE "governance"."schema_drift_log" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "command_tag" text NULL,
  "object_type" text NULL,
  "object_identity" text NULL,
  "actor_id" text NULL,
  "ip_address" inet NULL,
  "user_agent" text NULL,
  "executed_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "idx_drift_time" to table: "schema_drift_log"
CREATE INDEX "idx_drift_time" ON "governance"."schema_drift_log" USING BRIN ("executed_at");
-- Create "subscription_plans" table
CREATE TABLE "governance"."subscription_plans" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "price_monthly" bigint NOT NULL,
  "price_yearly" bigint NOT NULL,
  "default_max_products" integer NOT NULL DEFAULT 50,
  "default_max_orders" integer NOT NULL DEFAULT 100,
  "default_max_pages" integer NOT NULL DEFAULT 5,
  "default_max_staff" integer NOT NULL DEFAULT 3,
  "default_max_storage_gb" integer NOT NULL DEFAULT 1,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "code" character varying(50) NOT NULL,
  "name" character varying(100) NOT NULL,
  "currency" character varying(3) NOT NULL DEFAULT 'USD',
  "description" text NULL,
  "price_monthly_v2" numeric(12,4) NOT NULL,
  "price_yearly_v2" numeric(12,4) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "subscription_plans_code_unique" UNIQUE ("code"),
  CONSTRAINT "chk_plan_price" CHECK ((COALESCE(price_monthly_v2, (0)::numeric) >= (0)::numeric) AND (COALESCE(price_yearly_v2, (0)::numeric) >= (0)::numeric))
);
-- Create "system_config" table
CREATE TABLE "governance"."system_config" (
  "key" character varying(100) NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "value" jsonb NOT NULL,
  PRIMARY KEY ("key")
);
-- Create enum type "invoice_status"
CREATE TYPE "public"."invoice_status" AS ENUM ('draft', 'issued', 'paid', 'overdue');
-- Create "tenant_invoices" table
CREATE TABLE "governance"."tenant_invoices" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "paid_at" timestamptz NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "subscription_amount" numeric(12,4) NOT NULL DEFAULT 0,
  "platform_commission" numeric(12,4) NOT NULL DEFAULT 0,
  "app_charges" numeric(12,4) NOT NULL DEFAULT 0,
  "total" numeric(12,4) NOT NULL,
  "status" "public"."invoice_status" NOT NULL DEFAULT 'draft',
  "currency" character(3) NOT NULL DEFAULT 'USD',
  "pdf_url" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_tenant_invoices_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_invoice_math" CHECK (COALESCE(total, (0)::numeric) = ((COALESCE(subscription_amount, (0)::numeric) + COALESCE(platform_commission, (0)::numeric)) + COALESCE(app_charges, (0)::numeric))),
  CONSTRAINT "chk_invoice_period" CHECK (period_end >= period_start)
);
-- Create index "idx_invoices_status" to table: "tenant_invoices"
CREATE INDEX "idx_invoices_status" ON "governance"."tenant_invoices" ("status");
-- Create index "idx_invoices_tenant" to table: "tenant_invoices"
CREATE INDEX "idx_invoices_tenant" ON "governance"."tenant_invoices" ("tenant_id");
-- Create index "idx_tenant_invoices_tenant" to table: "tenant_invoices"
CREATE INDEX "idx_tenant_invoices_tenant" ON "governance"."tenant_invoices" ("tenant_id");
-- Create "tenant_quotas" table
CREATE TABLE "governance"."tenant_quotas" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "max_products" integer NULL,
  "max_orders" integer NULL,
  "max_pages" integer NULL,
  "max_staff" integer NULL,
  "max_categories" integer NULL,
  "max_coupons" integer NULL,
  "storage_limit_gb" integer NOT NULL DEFAULT 1,
  "api_rate_limit" integer NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_tenant_quotas_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_tenant_quotas_tenant" to table: "tenant_quotas"
CREATE INDEX "idx_tenant_quotas_tenant" ON "governance"."tenant_quotas" ("tenant_id");
-- Create "encryption_keys" table
CREATE TABLE "vault"."encryption_keys" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "rotated_at" timestamptz NULL,
  "expires_at" timestamptz NULL,
  "key_version" integer NOT NULL DEFAULT 1,
  "is_active" boolean NOT NULL DEFAULT true,
  "algorithm" character varying(20) NOT NULL DEFAULT 'AES-256-GCM',
  "key_fingerprint" character varying(64) NULL,
  "key_material" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_encryption_keys_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_key_material_s7" CHECK ((key_material IS NULL) OR ((jsonb_typeof(key_material) = 'object'::text) AND (key_material ? 'enc'::text) AND (key_material ? 'iv'::text) AND (key_material ? 'tag'::text) AND (key_material ? 'data'::text)))
);
-- Create index "idx_encryption_keys_tenant" to table: "encryption_keys"
CREATE INDEX "idx_encryption_keys_tenant" ON "vault"."encryption_keys" ("tenant_id");
-- Create enum type "tenant_status"
CREATE TYPE "public"."tenant_status" AS ENUM ('active', 'suspended', 'pending', 'archived');
-- Create enum type "order_status"
CREATE TYPE "public"."order_status" AS ENUM ('draft', 'awaiting_approval', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
-- Create enum type "payment_status"
CREATE TYPE "public"."payment_status" AS ENUM ('pending', 'paid', 'partially_refunded', 'refunded', 'failed');
-- Create enum type "payment_method"
CREATE TYPE "public"."payment_method" AS ENUM ('card', 'cod', 'wallet', 'bnpl', 'bank_transfer');
-- Create enum type "fulfillment_status"
CREATE TYPE "public"."fulfillment_status" AS ENUM ('pending', 'shipped', 'in_transit', 'delivered', 'failed');
-- Create enum type "order_source"
CREATE TYPE "public"."order_source" AS ENUM ('web', 'mobile', 'b2b', 'pos');
-- Create enum type "discount_type"
CREATE TYPE "public"."discount_type" AS ENUM ('percentage', 'fixed', 'buy_x_get_y', 'free_shipping');
-- Create enum type "discount_applies_to"
CREATE TYPE "public"."discount_applies_to" AS ENUM ('all', 'specific_products', 'specific_categories', 'specific_customers');
-- Create enum type "rma_status"
CREATE TYPE "public"."rma_status" AS ENUM ('requested', 'approved', 'shipped', 'received', 'completed', 'rejected');
-- Create enum type "rma_reason_code"
CREATE TYPE "public"."rma_reason_code" AS ENUM ('defective', 'wrong_item', 'changed_mind', 'not_as_described', 'damaged_in_transit');
-- Create enum type "rma_condition"
CREATE TYPE "public"."rma_condition" AS ENUM ('new', 'opened', 'damaged');
-- Create enum type "rma_resolution"
CREATE TYPE "public"."rma_resolution" AS ENUM ('refund', 'exchange', 'store_credit');
-- Create enum type "refund_status"
CREATE TYPE "public"."refund_status" AS ENUM ('pending', 'processed', 'failed');
-- Create "legal_pages" table
CREATE TABLE "storefront"."legal_pages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "version" integer NOT NULL DEFAULT 1,
  "is_published" boolean NOT NULL DEFAULT false,
  "page_type" text NOT NULL,
  "last_edited_by" text NULL,
  "title" jsonb NOT NULL,
  "content" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_legal_page_type" UNIQUE ("tenant_id", "page_type"),
  CONSTRAINT "uq_tenant_legal_pages_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "ck_legal_page_type" CHECK (page_type = ANY (ARRAY['privacy_policy'::text, 'terms_of_service'::text, 'shipping_policy'::text, 'return_policy'::text, 'cookie_policy'::text])),
  CONSTRAINT "ck_legal_version_positive" CHECK (version > 0)
);
-- Create index "idx_legal_pages_tenant" to table: "legal_pages"
CREATE INDEX "idx_legal_pages_tenant" ON "storefront"."legal_pages" ("tenant_id");
-- Create index "idx_legal_published" to table: "legal_pages"
CREATE INDEX "idx_legal_published" ON "storefront"."legal_pages" ("is_published");
-- Create index "idx_legal_tenant" to table: "legal_pages"
CREATE INDEX "idx_legal_tenant" ON "storefront"."legal_pages" ("tenant_id");
-- Create enum type "reservation_status"
CREATE TYPE "public"."reservation_status" AS ENUM ('active', 'converted', 'expired');
-- Create enum type "transfer_status"
CREATE TYPE "public"."transfer_status" AS ENUM ('draft', 'in_transit', 'received', 'cancelled');
-- Create enum type "purchase_order_status"
CREATE TYPE "public"."purchase_order_status" AS ENUM ('draft', 'ordered', 'partial', 'received', 'cancelled');
-- Create enum type "outbox_status"
CREATE TYPE "public"."outbox_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
-- Create enum type "affiliate_status"
CREATE TYPE "public"."affiliate_status" AS ENUM ('active', 'pending', 'suspended');
-- Create enum type "affiliate_tx_status"
CREATE TYPE "public"."affiliate_tx_status" AS ENUM ('pending', 'approved', 'paid', 'rejected');
-- Create "archival_vault" table
CREATE TABLE "vault"."archival_vault" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "table_name" text NOT NULL,
  "original_id" text NOT NULL,
  "tenant_id" uuid NOT NULL,
  "deleted_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_by" text NOT NULL,
  "payload" jsonb NOT NULL,
  "tombstone_hash" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_archival_vault_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_payload_size" CHECK (pg_column_size(payload) <= 102400)
);
-- Create enum type "b2b_user_role"
CREATE TYPE "public"."b2b_user_role" AS ENUM ('admin', 'buyer', 'viewer');
-- Create enum type "consent_channel"
CREATE TYPE "public"."consent_channel" AS ENUM ('email', 'sms', 'push', 'whatsapp');
-- Create enum type "location_type"
CREATE TYPE "public"."location_type" AS ENUM ('warehouse', 'retail', 'dropship');
-- Create "loyalty_rules" table
CREATE TABLE "storefront"."loyalty_rules" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" character varying(100) NOT NULL,
  "points_per_currency" numeric(10,4) NOT NULL DEFAULT 1,
  "min_redeem_points" integer NOT NULL DEFAULT 100,
  "points_expiry_days" integer NULL,
  "rewards" jsonb NOT NULL DEFAULT '[]',
  "is_active" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_loyalty_rules_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_loyalty_math" CHECK ((points_per_currency > (0)::numeric) AND (min_redeem_points > 0)),
  CONSTRAINT "chk_points_expiry" CHECK ((points_expiry_days IS NULL) OR (points_expiry_days > 0))
);
-- Create index "idx_loyalty_rules_tenant" to table: "loyalty_rules"
CREATE INDEX "idx_loyalty_rules_tenant" ON "storefront"."loyalty_rules" ("tenant_id");
-- Create "entity_metafields" table
CREATE TABLE "storefront"."entity_metafields" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "entity_type" character varying(50) NOT NULL,
  "entity_id" uuid NOT NULL,
  "namespace" character varying(100) NOT NULL DEFAULT 'global',
  "key" character varying(100) NOT NULL,
  "type" character varying(20) NOT NULL DEFAULT 'string',
  "value" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_metafield" UNIQUE ("entity_type", "entity_id", "namespace", "key"),
  CONSTRAINT "uq_tenant_entity_metafields_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_metafield_size" CHECK (pg_column_size(value) <= 10240)
);
-- Create index "idx_metafields_lookup" to table: "entity_metafields"
CREATE INDEX "idx_metafields_lookup" ON "storefront"."entity_metafields" ("entity_type", "entity_id");
-- Create index "idx_metafields_tenant" to table: "entity_metafields"
CREATE INDEX "idx_metafields_tenant" ON "storefront"."entity_metafields" ("tenant_id");
-- Create "outbox_events" table
CREATE TABLE "storefront"."outbox_events" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "processed_at" timestamptz NULL,
  "retry_count" integer NOT NULL DEFAULT 0,
  "status" "public"."outbox_status" NOT NULL DEFAULT 'pending',
  "event_type" character varying(100) NOT NULL,
  "aggregate_type" character varying(50) NULL,
  "aggregate_id" uuid NULL,
  "payload" jsonb NOT NULL,
  "trace_id" character varying(100) NULL,
  "locked_by" character varying(100) NULL,
  "locked_at" timestamptz NULL,
  PRIMARY KEY ("id", "created_at"),
  CONSTRAINT "uq_tenant_outbox_events_composite" UNIQUE ("tenant_id", "id", "created_at"),
  CONSTRAINT "chk_payload_size" CHECK (pg_column_size(payload) <= 524288)
) PARTITION BY RANGE ("created_at");
-- Create index "idx_outbox_created_brin" to table: "outbox_events"
CREATE INDEX "idx_outbox_created_brin" ON "storefront"."outbox_events" USING BRIN ("created_at");
-- Create index "idx_outbox_events_tenant_active" to table: "outbox_events"
CREATE INDEX "idx_outbox_events_tenant_active" ON "storefront"."outbox_events" ("tenant_id");
-- Create index "idx_outbox_pending" to table: "outbox_events"
CREATE INDEX "idx_outbox_pending" ON "storefront"."outbox_events" ("status", "created_at") WHERE (status = 'pending'::public.outbox_status);
-- Create "announcement_bars" table
CREATE TABLE "storefront"."announcement_bars" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "bg_color" character varying(20) NOT NULL DEFAULT '#000000',
  "text_color" character varying(20) NOT NULL DEFAULT '#ffffff',
  "content" jsonb NOT NULL,
  "link_url" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_announcement_bars_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_announcements_tenant" to table: "announcement_bars"
CREATE INDEX "idx_announcements_tenant" ON "storefront"."announcement_bars" ("tenant_id");
-- Create "wallet_transactions" table
CREATE TABLE "storefront"."wallet_transactions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "order_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "amount" numeric(12,4) NOT NULL,
  "balance_before" numeric(12,4) NOT NULL,
  "balance_after" numeric(12,4) NOT NULL,
  "type" character varying(20) NOT NULL,
  "reason" character varying(100) NOT NULL,
  "description" text NULL,
  "idempotency_key" character varying(100) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_wallet_transactions_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_wallet_math" CHECK (COALESCE(balance_after, (0)::numeric) = (COALESCE(balance_before, (0)::numeric) + COALESCE(amount, (0)::numeric))),
  CONSTRAINT "wallet_non_negative_balance" CHECK (COALESCE(balance_after, (0)::numeric) >= (0)::numeric)
);
-- Create index "idx_wallet_created" to table: "wallet_transactions"
CREATE INDEX "idx_wallet_created" ON "storefront"."wallet_transactions" USING BRIN ("created_at");
-- Create index "idx_wallet_customer" to table: "wallet_transactions"
CREATE INDEX "idx_wallet_customer" ON "storefront"."wallet_transactions" ("customer_id");
-- Create index "idx_wallet_transactions_tenant" to table: "wallet_transactions"
CREATE INDEX "idx_wallet_transactions_tenant" ON "storefront"."wallet_transactions" ("tenant_id");
-- Create index "wallet_tx_idempotency" to table: "wallet_transactions"
CREATE UNIQUE INDEX "wallet_tx_idempotency" ON "storefront"."wallet_transactions" ("tenant_id", "idempotency_key") WHERE (idempotency_key IS NOT NULL);
-- Create "customers" table
CREATE TABLE "storefront"."customers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_login_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "date_of_birth" date NULL,
  "wallet_balance" numeric(12,4) NOT NULL DEFAULT 0,
  "total_spent_amount" numeric(12,4) NOT NULL DEFAULT 0,
  "loyalty_points" integer NOT NULL DEFAULT 0,
  "total_orders_count" integer NOT NULL DEFAULT 0,
  "is_verified" boolean NOT NULL DEFAULT false,
  "accepts_marketing" boolean NOT NULL DEFAULT false,
  "email" jsonb NOT NULL,
  "email_hash" character(64) NOT NULL,
  "password_hash" text NULL,
  "first_name" jsonb NULL,
  "last_name" jsonb NULL,
  "phone" jsonb NULL,
  "phone_hash" character(64) NULL,
  "avatar_url" text NULL,
  "gender" character varying(10) NULL,
  "language" character(2) NOT NULL DEFAULT 'ar',
  "notes" text NULL,
  "tags" text NULL,
  "version" integer NOT NULL DEFAULT 1,
  "lock_version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_customer" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_cust_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
  CONSTRAINT "chk_cust_firstname_s7" CHECK ((first_name IS NULL) OR ((jsonb_typeof(first_name) = 'object'::text) AND (first_name ? 'enc'::text) AND (first_name ? 'iv'::text) AND (first_name ? 'tag'::text) AND (first_name ? 'data'::text))),
  CONSTRAINT "chk_cust_lastname_s7" CHECK ((last_name IS NULL) OR ((jsonb_typeof(last_name) = 'object'::text) AND (last_name ? 'enc'::text) AND (last_name ? 'iv'::text) AND (last_name ? 'tag'::text) AND (last_name ? 'data'::text))),
  CONSTRAINT "chk_cust_phone_s7" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))),
  CONSTRAINT "chk_cust_pwd_hash" CHECK ((password_hash IS NULL) OR (password_hash ~ '^\$2[ayb]\$.+$'::text)),
  CONSTRAINT "chk_dob_past" CHECK ((date_of_birth IS NULL) OR (date_of_birth <= CURRENT_DATE)),
  CONSTRAINT "chk_total_spent_pos" CHECK ((COALESCE(total_spent_amount, (0)::numeric) >= (0)::numeric) AND (total_spent_amount IS NOT NULL)),
  CONSTRAINT "chk_wallet_bal_pos" CHECK ((COALESCE(wallet_balance, (0)::numeric) >= (0)::numeric) AND (wallet_balance IS NOT NULL) AND (wallet_balance IS NOT NULL))
);
-- Create index "idx_customer_email_hash" to table: "customers"
CREATE UNIQUE INDEX "idx_customer_email_hash" ON "storefront"."customers" ("tenant_id", "email_hash") WHERE (deleted_at IS NULL);
-- Create index "idx_customer_phone_hash" to table: "customers"
CREATE UNIQUE INDEX "idx_customer_phone_hash" ON "storefront"."customers" ("tenant_id", "phone_hash") WHERE (deleted_at IS NULL);
-- Create index "idx_customers_active" to table: "customers"
CREATE INDEX "idx_customers_active" ON "storefront"."customers" ("created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_customers_dob" to table: "customers"
CREATE INDEX "idx_customers_dob" ON "storefront"."customers" ("date_of_birth");
-- Create index "idx_customers_tags" to table: "customers"
CREATE INDEX "idx_customers_tags" ON "storefront"."customers" ("tags");
-- Create index "idx_customers_tenant" to table: "customers"
CREATE INDEX "idx_customers_tenant" ON "storefront"."customers" ("tenant_id");
-- Create "tenant_config" table
CREATE TABLE "storefront"."tenant_config" (
  "key" character varying(100) NOT NULL,
  "tenant_id" uuid NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("key", "tenant_id"),
  CONSTRAINT "chk_config_key" CHECK ((key)::text ~ '^[a-zA-Z0-9_]+$'::text),
  CONSTRAINT "chk_tc_value_size" CHECK (pg_column_size(value) <= 102400)
);
-- Create index "idx_tenant_config_tenant_active" to table: "tenant_config"
CREATE INDEX "idx_tenant_config_tenant_active" ON "storefront"."tenant_config" ("tenant_id");
-- Create "smart_collections" table
CREATE TABLE "storefront"."smart_collections" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "slug" character varying(255) NOT NULL,
  "match_type" character varying(5) NOT NULL DEFAULT 'all',
  "sort_by" character varying(50) NOT NULL DEFAULT 'best_selling',
  "image_url" text NULL,
  "meta_title" character varying(70) NULL,
  "meta_description" character varying(160) NULL,
  "title" jsonb NOT NULL,
  "conditions" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "idx_smart_collections_slug" UNIQUE ("tenant_id", "slug"),
  CONSTRAINT "uq_tenant_smart_collections_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_conditions_array" CHECK (jsonb_typeof(conditions) = 'array'::text),
  CONSTRAINT "conditions_size" CHECK (pg_column_size(conditions) <= 10240)
);
-- Create index "idx_smart_collections_tenant" to table: "smart_collections"
CREATE INDEX "idx_smart_collections_tenant" ON "storefront"."smart_collections" ("tenant_id");
-- Create "banners" table
CREATE TABLE "storefront"."banners" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "location" character varying(50) NOT NULL DEFAULT 'home_top',
  "image_url" text NOT NULL,
  "link_url" text NULL,
  "title" jsonb NULL,
  "content" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_banners_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_banners_active" to table: "banners"
CREATE INDEX "idx_banners_active" ON "storefront"."banners" ("is_active", "location");
-- Create index "idx_banners_tenant" to table: "banners"
CREATE INDEX "idx_banners_tenant" ON "storefront"."banners" ("tenant_id");
-- Create "blog_posts" table
CREATE TABLE "storefront"."blog_posts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "published_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "read_time_min" integer NULL,
  "view_count" integer NOT NULL DEFAULT 0,
  "is_published" boolean NOT NULL DEFAULT false,
  "slug" character varying(255) NOT NULL,
  "category" character varying(100) NULL,
  "author_name" character varying(100) NULL,
  "meta_title" character varying(70) NULL,
  "meta_description" character varying(160) NULL,
  "featured_image" text NULL,
  "tags" text[] NULL,
  "title" jsonb NOT NULL,
  "excerpt" jsonb NULL,
  "content" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_blog_posts_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_blog_posts_tenant" to table: "blog_posts"
CREATE INDEX "idx_blog_posts_tenant" ON "storefront"."blog_posts" ("tenant_id");
-- Create index "idx_blog_published" to table: "blog_posts"
CREATE INDEX "idx_blog_published" ON "storefront"."blog_posts" ("is_published");
-- Create index "idx_blog_published_at" to table: "blog_posts"
CREATE INDEX "idx_blog_published_at" ON "storefront"."blog_posts" ("published_at");
-- Create index "idx_blog_slug_active" to table: "blog_posts"
CREATE UNIQUE INDEX "idx_blog_slug_active" ON "storefront"."blog_posts" ("tenant_id", "slug") WHERE (deleted_at IS NULL);
-- Create index "idx_blog_tags" to table: "blog_posts"
CREATE INDEX "idx_blog_tags" ON "storefront"."blog_posts" USING GIN ("tags");
-- Create "shipping_zones" table
CREATE TABLE "storefront"."shipping_zones" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "base_price" numeric(12,4) NOT NULL,
  "free_shipping_threshold" numeric(12,4) NULL,
  "min_delivery_days" integer NULL,
  "max_delivery_days" integer NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "name" character varying(100) NOT NULL,
  "region" character varying(100) NOT NULL,
  "country" character(2) NULL,
  "carrier" character varying(50) NULL,
  "estimated_days" character varying(50) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_shipping_zones_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_delivery_logic" CHECK ((min_delivery_days >= 0) AND (min_delivery_days <= max_delivery_days))
);
-- Create index "idx_shipping_active" to table: "shipping_zones"
CREATE INDEX "idx_shipping_active" ON "storefront"."shipping_zones" ("is_active");
-- Create index "idx_shipping_region" to table: "shipping_zones"
CREATE INDEX "idx_shipping_region" ON "storefront"."shipping_zones" ("region");
-- Create index "idx_shipping_zones_tenant" to table: "shipping_zones"
CREATE INDEX "idx_shipping_zones_tenant" ON "storefront"."shipping_zones" ("tenant_id");
-- Add new schema named "legacy"
CREATE SCHEMA "legacy";
-- Create enum type "b2b_company_status"
CREATE TYPE "public"."b2b_company_status" AS ENUM ('active', 'pending', 'suspended');
-- Create "search_synonyms" table
CREATE TABLE "storefront"."search_synonyms" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "term" character varying(100) NOT NULL,
  "synonyms" jsonb NOT NULL,
  "language_code" character(2) NOT NULL DEFAULT 'ar',
  "is_bidirectional" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("id"),
  CONSTRAINT "search_synonyms_term_unique" UNIQUE ("tenant_id", "term"),
  CONSTRAINT "uq_tenant_search_synonyms_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_synonym_no_self_loop" CHECK (NOT (synonyms ? (term)::text))
);
-- Create "reviews" table
CREATE TABLE "storefront"."reviews" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "customer_id" uuid NULL,
  "rating" integer NOT NULL,
  "comment" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_verified" boolean NOT NULL DEFAULT false,
  "sentiment_score" numeric(3,2) NULL,
  "is_anomaly_flagged" boolean NOT NULL DEFAULT false,
  "embedding" text NULL,
  "sentiment_confidence" numeric(3,2) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_reviews_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_rating_bounds" CHECK ((rating >= 1) AND (rating <= 5)),
  CONSTRAINT "chk_sentiment_bounds" CHECK ((sentiment_score >= '-1.00'::numeric) AND (sentiment_score <= 1.00))
);
-- Create index "idx_reviews_embedding_cosine" to table: "reviews"
CREATE INDEX "idx_reviews_embedding_cosine" ON "storefront"."reviews" ("embedding");
-- Create index "idx_reviews_tenant" to table: "reviews"
CREATE INDEX "idx_reviews_tenant" ON "storefront"."reviews" ("tenant_id");
-- Create "product_views" table
CREATE TABLE "storefront"."product_views" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "customer_id" uuid NULL,
  "session_id" character varying(64) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "dwell_time_seconds" integer NOT NULL DEFAULT 0,
  "source_medium" character varying(100) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_product_views_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_product_views_tenant" to table: "product_views"
CREATE INDEX "idx_product_views_tenant" ON "storefront"."product_views" ("tenant_id");
-- Create index "idx_pv_product" to table: "product_views"
CREATE INDEX "idx_pv_product" ON "storefront"."product_views" ("product_id");
-- Create index "idx_pv_tenant" to table: "product_views"
CREATE INDEX "idx_pv_tenant" ON "storefront"."product_views" ("tenant_id");
-- Create "currency_rates" table
CREATE TABLE "storefront"."currency_rates" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "from_currency" character(3) NOT NULL,
  "to_currency" character(3) NOT NULL,
  "rate" numeric(12,6) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_currency_pair" UNIQUE ("tenant_id", "from_currency", "to_currency"),
  CONSTRAINT "uq_tenant_currency_rates_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_currency_rates_tenant_active" to table: "currency_rates"
CREATE INDEX "idx_currency_rates_tenant_active" ON "storefront"."currency_rates" ("tenant_id");
-- Create "popups" table
CREATE TABLE "storefront"."popups" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "trigger_type" character varying(20) NOT NULL DEFAULT 'time_on_page',
  "content" jsonb NOT NULL,
  "settings" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_popups_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_popups_tenant" to table: "popups"
CREATE INDEX "idx_popups_tenant" ON "storefront"."popups" ("tenant_id");
-- Create "customer_segments" table
CREATE TABLE "storefront"."customer_segments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "customer_count" integer NOT NULL DEFAULT 0,
  "auto_update" boolean NOT NULL DEFAULT true,
  "match_type" character varying(5) NOT NULL DEFAULT 'all',
  "name" jsonb NOT NULL,
  "conditions" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_customer_segments_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_customer_segments_tenant" to table: "customer_segments"
CREATE INDEX "idx_customer_segments_tenant" ON "storefront"."customer_segments" ("tenant_id");
-- Create "abandoned_checkouts" table
CREATE TABLE "storefront"."abandoned_checkouts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "recovered_at" timestamptz NULL,
  "subtotal" numeric(12,4) NULL,
  "recovery_email_sent" boolean NOT NULL DEFAULT false,
  "email" jsonb NULL,
  "items" jsonb NULL,
  "recovery_coupon_code" character varying(50) NULL,
  "recovered_amount" numeric(12,4) NOT NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_abandoned_checkouts_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ac_customer" FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "storefront"."customers" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_abandoned_checkouts_tenant" to table: "abandoned_checkouts"
CREATE INDEX "idx_abandoned_checkouts_tenant" ON "storefront"."abandoned_checkouts" ("tenant_id");
-- Create index "idx_abandoned_created" to table: "abandoned_checkouts"
CREATE INDEX "idx_abandoned_created" ON "storefront"."abandoned_checkouts" ("created_at");
-- Create "affiliate_partners" table
CREATE TABLE "storefront"."affiliate_partners" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "commission_rate" integer NOT NULL DEFAULT 500,
  "total_earned" numeric(12,4) NOT NULL DEFAULT 0,
  "total_paid" numeric(12,4) NOT NULL DEFAULT 0,
  "status" "public"."affiliate_status" NOT NULL DEFAULT 'pending',
  "referral_code" character varying(50) NOT NULL,
  "email" jsonb NOT NULL,
  "email_hash" text NULL,
  "payout_details" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "affiliate_partners_referral_code_unique" UNIQUE ("tenant_id", "referral_code"),
  CONSTRAINT "uq_tenant_affiliate" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_aff_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
  CONSTRAINT "chk_aff_payout_s7" CHECK ((payout_details IS NULL) OR ((jsonb_typeof(payout_details) = 'object'::text) AND (payout_details ? 'enc'::text) AND (payout_details ? 'iv'::text) AND (payout_details ? 'tag'::text) AND (payout_details ? 'data'::text))),
  CONSTRAINT "chk_aff_rate_cap" CHECK ((commission_rate >= 0) AND (commission_rate <= 10000)),
  CONSTRAINT "chk_ref_code_upper" CHECK ((referral_code)::text = upper((referral_code)::text))
);
-- Create index "idx_affiliate_email_hash" to table: "affiliate_partners"
CREATE INDEX "idx_affiliate_email_hash" ON "storefront"."affiliate_partners" ("email_hash");
-- Create index "idx_affiliate_partners_tenant" to table: "affiliate_partners"
CREATE INDEX "idx_affiliate_partners_tenant" ON "storefront"."affiliate_partners" ("tenant_id");
-- Create "affiliate_transactions" table
CREATE TABLE "storefront"."affiliate_transactions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "partner_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "paid_at" timestamptz NULL,
  "commission_amount" numeric(12,4) NOT NULL,
  "hold_period_ends_at" timestamptz NULL,
  "status" "public"."affiliate_tx_status" NOT NULL DEFAULT 'pending',
  "payout_reference" character varying(100) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_affiliate_transactions_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_afftx_partner" FOREIGN KEY ("tenant_id", "partner_id") REFERENCES "storefront"."affiliate_partners" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_aff_comm_positive" CHECK (COALESCE(commission_amount, (0)::numeric) > (0)::numeric)
);
-- Create index "idx_aff_trans_created_brin" to table: "affiliate_transactions"
CREATE INDEX "idx_aff_trans_created_brin" ON "storefront"."affiliate_transactions" USING BRIN ("created_at");
-- Create index "idx_aff_trans_order" to table: "affiliate_transactions"
CREATE INDEX "idx_aff_trans_order" ON "storefront"."affiliate_transactions" ("order_id");
-- Create index "idx_aff_trans_partner" to table: "affiliate_transactions"
CREATE INDEX "idx_aff_trans_partner" ON "storefront"."affiliate_transactions" ("partner_id");
-- Create index "idx_affiliate_transactions_tenant" to table: "affiliate_transactions"
CREATE INDEX "idx_affiliate_transactions_tenant" ON "storefront"."affiliate_transactions" ("tenant_id");
-- Create "b2b_companies" table
CREATE TABLE "storefront"."b2b_companies" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "credit_limit" numeric(12,4) NOT NULL DEFAULT 0,
  "credit_used" numeric(12,4) NOT NULL DEFAULT 0,
  "payment_terms_days" integer NOT NULL DEFAULT 30,
  "status" "public"."b2b_company_status" NOT NULL DEFAULT 'pending',
  "name" character varying(255) NOT NULL,
  "tax_id" character varying(50) NULL,
  "industry" character varying(100) NULL,
  "lock_version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_b2b_companies_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_credit_limit_positive" CHECK (COALESCE(credit_limit, (0)::numeric) >= (0)::numeric),
  CONSTRAINT "chk_tax_id_len" CHECK ((tax_id IS NULL) OR (length((tax_id)::text) >= 5))
);
-- Create index "idx_b2b_companies_tenant" to table: "b2b_companies"
CREATE INDEX "idx_b2b_companies_tenant" ON "storefront"."b2b_companies" ("tenant_id");
-- Create "brands" table
CREATE TABLE "storefront"."brands" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "slug" character varying(255) NOT NULL,
  "country" character(2) NULL,
  "website_url" text NULL,
  "logo_url" text NULL,
  "name" jsonb NOT NULL,
  "description" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_brands_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_brands_active" to table: "brands"
CREATE INDEX "idx_brands_active" ON "storefront"."brands" ("is_active") WHERE (deleted_at IS NULL);
-- Create index "idx_brands_slug_active" to table: "brands"
CREATE UNIQUE INDEX "idx_brands_slug_active" ON "storefront"."brands" ("tenant_id", "slug") WHERE (deleted_at IS NULL);
-- Create index "idx_brands_tenant" to table: "brands"
CREATE INDEX "idx_brands_tenant" ON "storefront"."brands" ("tenant_id");
-- Create "categories" table
CREATE TABLE "storefront"."categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "parent_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "products_count" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "slug" character varying(255) NOT NULL,
  "icon" character varying(100) NULL,
  "meta_title" character varying(150) NULL,
  "meta_description" character varying(255) NULL,
  "image_url" text NULL,
  "banner_url" text NULL,
  "name" jsonb NOT NULL,
  "description" jsonb NULL,
  "path" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_cat" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_cat_parent" FOREIGN KEY ("tenant_id", "parent_id") REFERENCES "storefront"."categories" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_categories_no_circular_ref" CHECK ((parent_id IS NULL) OR (parent_id <> id))
);
-- Create index "idx_categories_active" to table: "categories"
CREATE INDEX "idx_categories_active" ON "storefront"."categories" ("is_active") WHERE (deleted_at IS NULL);
-- Create index "idx_categories_parent" to table: "categories"
CREATE INDEX "idx_categories_parent" ON "storefront"."categories" ("parent_id");
-- Create index "idx_categories_slug_active" to table: "categories"
CREATE UNIQUE INDEX "idx_categories_slug_active" ON "storefront"."categories" ("tenant_id", "slug") WHERE (deleted_at IS NULL);
-- Create index "idx_categories_tenant" to table: "categories"
CREATE INDEX "idx_categories_tenant" ON "storefront"."categories" ("tenant_id");
-- Create "products" table
CREATE TABLE "storefront"."products" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "brand_id" uuid NULL,
  "category_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "published_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "base_price" numeric(12,4) NOT NULL,
  "sale_price" numeric(12,4) NULL,
  "cost_price" numeric(12,4) NULL,
  "compare_at_price" numeric(12,4) NULL,
  "tax_basis_points" integer NOT NULL DEFAULT 0,
  "low_stock_threshold" integer NOT NULL DEFAULT 5,
  "sold_count" integer NOT NULL DEFAULT 0,
  "view_count" integer NOT NULL DEFAULT 0,
  "review_count" integer NOT NULL DEFAULT 0,
  "weight" integer NULL,
  "min_order_qty" integer NOT NULL DEFAULT 1,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_featured" boolean NOT NULL DEFAULT false,
  "is_returnable" boolean NOT NULL DEFAULT true,
  "requires_shipping" boolean NOT NULL DEFAULT true,
  "is_digital" boolean NOT NULL DEFAULT false,
  "track_inventory" boolean NOT NULL DEFAULT true,
  "slug" character varying(255) NOT NULL,
  "sku" character varying(100) NOT NULL,
  "barcode" character varying(50) NULL,
  "country_of_origin" character varying(100) NULL,
  "meta_title" character varying(70) NULL,
  "meta_description" character varying(160) NULL,
  "main_image" text NOT NULL,
  "video_url" text NULL,
  "digital_file_url" text NULL,
  "keywords" text NULL,
  "avg_rating" numeric(3,2) NOT NULL DEFAULT 0,
  "tags" text[] NULL,
  "name" jsonb NOT NULL,
  "short_description" jsonb NULL,
  "long_description" jsonb NULL,
  "specifications" jsonb NOT NULL DEFAULT '{}',
  "dimensions" jsonb NULL,
  "gallery_images" jsonb NOT NULL DEFAULT '[]',
  "embedding" text NULL,
  "version" bigint NOT NULL DEFAULT 1,
  "warranty_period" integer NULL,
  "warranty_unit" character varying(10) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_product" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_prod_brand" FOREIGN KEY ("brand_id") REFERENCES "storefront"."brands" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_prod_cat" FOREIGN KEY ("category_id") REFERENCES "storefront"."categories" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_barcode_format" CHECK ((barcode IS NULL) OR ((barcode)::text ~ '^[A-Z0-9-]{8,50} $'::text)),
  CONSTRAINT "chk_compare_price" CHECK ((compare_at_price IS NULL) OR ((COALESCE(compare_at_price, (0)::numeric) > COALESCE(base_price, (0)::numeric)) AND (compare_at_price IS NOT NULL))),
  CONSTRAINT "chk_digital_shipping" CHECK (NOT (is_digital AND requires_shipping)),
  CONSTRAINT "chk_price_positive" CHECK ((COALESCE(base_price, (0)::numeric) >= (0)::numeric) AND (base_price IS NOT NULL) AND (base_price IS NOT NULL)),
  CONSTRAINT "chk_sale_price_math" CHECK ((sale_price IS NULL) OR ((COALESCE(sale_price, (0)::numeric) <= COALESCE(base_price, (0)::numeric)) AND (sale_price IS NOT NULL))),
  CONSTRAINT "chk_specs_size" CHECK (pg_column_size(specifications) <= 20480)
);
-- Create index "idx_products_active" to table: "products"
CREATE INDEX "idx_products_active" ON "storefront"."products" ("category_id") WHERE (deleted_at IS NULL);
-- Create index "idx_products_brand" to table: "products"
CREATE INDEX "idx_products_brand" ON "storefront"."products" ("brand_id");
-- Create index "idx_products_embedding_cosine" to table: "products"
CREATE INDEX "idx_products_embedding_cosine" ON "storefront"."products" ("embedding");
-- Create index "idx_products_featured" to table: "products"
CREATE INDEX "idx_products_featured" ON "storefront"."products" ("is_featured") WHERE (deleted_at IS NULL);
-- Create index "idx_products_name" to table: "products"
CREATE INDEX "idx_products_name" ON "storefront"."products" USING GIN ("name");
-- Create index "idx_products_sku_active" to table: "products"
CREATE UNIQUE INDEX "idx_products_sku_active" ON "storefront"."products" ("tenant_id", "sku") WHERE (deleted_at IS NULL);
-- Create index "idx_products_slug_active" to table: "products"
CREATE UNIQUE INDEX "idx_products_slug_active" ON "storefront"."products" ("tenant_id", "slug") WHERE (deleted_at IS NULL);
-- Create index "idx_products_tags" to table: "products"
CREATE INDEX "idx_products_tags" ON "storefront"."products" USING GIN ("tags");
-- Create index "idx_products_tenant" to table: "products"
CREATE INDEX "idx_products_tenant" ON "storefront"."products" ("tenant_id");
-- Create "b2b_pricing_tiers" table
CREATE TABLE "storefront"."b2b_pricing_tiers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "discount_basis_points" integer NULL,
  "name" text NOT NULL,
  "min_quantity" integer NOT NULL DEFAULT 1,
  "max_quantity" integer NULL,
  "price" numeric(12,4) NULL,
  "currency" character(3) NOT NULL DEFAULT 'SAR',
  "quantity_range" int4range NOT NULL,
  "lock_version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_b2b_pricing_tiers_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_b2bpt_company" FOREIGN KEY ("company_id") REFERENCES "storefront"."b2b_companies" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_b2bpt_product" FOREIGN KEY ("tenant_id", "product_id") REFERENCES "storefront"."products" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_b2b_discount_max" CHECK ((discount_basis_points IS NULL) OR (discount_basis_points <= 10000)),
  CONSTRAINT "chk_b2b_price_pos" CHECK ((price IS NULL) OR ((price >= (0)::numeric) AND (price IS NOT NULL))),
  CONSTRAINT "chk_b2b_price_xor" CHECK ((price IS NULL) <> (discount_basis_points IS NULL))
);
-- Create index "idx_b2b_pricing" to table: "b2b_pricing_tiers"
CREATE INDEX "idx_b2b_pricing" ON "storefront"."b2b_pricing_tiers" ("company_id", "product_id");
-- Create index "idx_b2bp_tenant" to table: "b2b_pricing_tiers"
CREATE INDEX "idx_b2bp_tenant" ON "storefront"."b2b_pricing_tiers" ("tenant_id");
-- Create "b2b_users" table
CREATE TABLE "storefront"."b2b_users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "role" "public"."b2b_user_role" NOT NULL DEFAULT 'buyer',
  "unit_price" numeric(12,4) NOT NULL DEFAULT 0,
  "currency" character(3) NOT NULL DEFAULT 'SAR',
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_b2b_company_customer" UNIQUE ("tenant_id", "company_id", "customer_id"),
  CONSTRAINT "uq_tenant_b2b_users_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_b2bu_company" FOREIGN KEY ("company_id") REFERENCES "storefront"."b2b_companies" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_b2b_unit_price_pos" CHECK (COALESCE(unit_price, (0)::numeric) >= (0)::numeric)
);
-- Create index "idx_b2b_user" to table: "b2b_users"
CREATE INDEX "idx_b2b_user" ON "storefront"."b2b_users" ("company_id");
-- Create index "idx_b2b_users_tenant" to table: "b2b_users"
CREATE INDEX "idx_b2b_users_tenant" ON "storefront"."b2b_users" ("tenant_id");
-- Create "carts" table
CREATE TABLE "storefront"."carts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NULL,
  "subtotal" numeric(12,4) NULL,
  "session_id" character varying(64) NULL,
  "items" jsonb NOT NULL,
  "applied_coupons" jsonb NULL,
  "lock_version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_cart" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_cart_customer" FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "storefront"."customers" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_cart_items_size" CHECK (pg_column_size(items) <= 51200),
  CONSTRAINT "chk_cart_subtotal_pos" CHECK ((subtotal IS NULL) OR (COALESCE(subtotal, (0)::numeric) >= (0)::numeric))
);
-- Create index "idx_carts_customer" to table: "carts"
CREATE INDEX "idx_carts_customer" ON "storefront"."carts" ("customer_id");
-- Create index "idx_carts_expires" to table: "carts"
CREATE INDEX "idx_carts_expires" ON "storefront"."carts" ("expires_at");
-- Create index "idx_carts_session" to table: "carts"
CREATE INDEX "idx_carts_session" ON "storefront"."carts" ("session_id");
-- Create index "idx_carts_tenant" to table: "carts"
CREATE INDEX "idx_carts_tenant" ON "storefront"."carts" ("tenant_id");
-- Create "cart_items" table
CREATE TABLE "storefront"."cart_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "cart_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "price" numeric(12,4) NOT NULL,
  "added_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_cart_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ci_cart" FOREIGN KEY ("tenant_id", "cart_id") REFERENCES "storefront"."carts" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "chk_cart_item_price" CHECK (COALESCE(price, (0)::numeric) >= (0)::numeric)
);
-- Create index "idx_cart_items_cart" to table: "cart_items"
CREATE INDEX "idx_cart_items_cart" ON "storefront"."cart_items" ("cart_id");
-- Create index "idx_cart_items_tenant" to table: "cart_items"
CREATE INDEX "idx_cart_items_tenant" ON "storefront"."cart_items" ("tenant_id");
-- Create "coupons" table
CREATE TABLE "storefront"."coupons" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "starts_at" timestamptz NULL,
  "expires_at" timestamptz NULL,
  "value" numeric(12,4) NOT NULL,
  "min_order_amount" numeric(12,4) NOT NULL DEFAULT 0,
  "max_uses" integer NULL,
  "used_count" integer NOT NULL DEFAULT 0,
  "max_uses_per_customer" integer NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "code" character varying(50) NOT NULL,
  "type" character varying(20) NOT NULL,
  "lock_version" integer NOT NULL DEFAULT 1,
  "version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "coupons_code_unique" UNIQUE ("tenant_id", "code"),
  CONSTRAINT "uq_tenant_coupon_id" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_coupon_min_amount" CHECK (COALESCE(min_order_amount, (0)::numeric) >= (0)::numeric),
  CONSTRAINT "chk_coupon_pct" CHECK (((type)::text <> 'percentage'::text) OR (COALESCE(value, (0)::numeric) <= (10000)::numeric)),
  CONSTRAINT "chk_coupon_val_positive" CHECK (COALESCE(value, (0)::numeric) > (0)::numeric),
  CONSTRAINT "coupon_code_upper_check" CHECK ((code)::text = upper((code)::text)),
  CONSTRAINT "coupon_usage_exhaustion_check" CHECK (used_count <= max_uses)
);
-- Create index "idx_coupons_active" to table: "coupons"
CREATE INDEX "idx_coupons_active" ON "storefront"."coupons" ("is_active");
-- Create index "idx_coupons_code" to table: "coupons"
CREATE INDEX "idx_coupons_code" ON "storefront"."coupons" ("code");
-- Create index "idx_coupons_tenant" to table: "coupons"
CREATE INDEX "idx_coupons_tenant" ON "storefront"."coupons" ("tenant_id");
-- Create "coupon_usages" table
CREATE TABLE "storefront"."coupon_usages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "coupon_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "order_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_coupon_cust_order" UNIQUE ("tenant_id", "coupon_id", "customer_id", "order_id"),
  CONSTRAINT "uq_tenant_coupon_usages_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_cu_coupon" FOREIGN KEY ("tenant_id", "coupon_id") REFERENCES "storefront"."coupons" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_coupon_usages_lookup" to table: "coupon_usages"
CREATE INDEX "idx_coupon_usages_lookup" ON "storefront"."coupon_usages" ("coupon_id", "customer_id");
-- Create index "idx_coupon_usages_tenant" to table: "coupon_usages"
CREATE INDEX "idx_coupon_usages_tenant" ON "storefront"."coupon_usages" ("tenant_id");
-- Create "customer_addresses" table
CREATE TABLE "storefront"."customer_addresses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "is_default" boolean NOT NULL DEFAULT false,
  "is_default_billing" boolean NOT NULL DEFAULT false,
  "label" character varying(50) NULL,
  "name" character varying(255) NOT NULL,
  "line1" jsonb NOT NULL,
  "line2" jsonb NULL,
  "city" character varying(100) NOT NULL,
  "state" character varying(100) NULL,
  "postal_code" jsonb NOT NULL,
  "country" character(2) NOT NULL,
  "phone" jsonb NULL,
  "coordinates" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_customer_addresses_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_addr_cust" FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "storefront"."customers" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_addr_phone_encrypted" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))),
  CONSTRAINT "chk_city_not_empty" CHECK (length(TRIM(BOTH FROM city)) > 0),
  CONSTRAINT "chk_line1_encrypted" CHECK ((line1 IS NULL) OR ((jsonb_typeof(line1) = 'object'::text) AND (line1 ? 'enc'::text) AND (line1 ? 'iv'::text) AND (line1 ? 'tag'::text) AND (line1 ? 'data'::text))),
  CONSTRAINT "chk_postal_code_encrypted" CHECK ((postal_code IS NULL) OR ((jsonb_typeof(postal_code) = 'object'::text) AND (postal_code ? 'enc'::text) AND (postal_code ? 'iv'::text) AND (postal_code ? 'tag'::text) AND (postal_code ? 'data'::text)))
);
-- Create index "idx_customer_addresses_customer" to table: "customer_addresses"
CREATE INDEX "idx_customer_addresses_customer" ON "storefront"."customer_addresses" ("customer_id");
-- Create index "idx_customer_addresses_tenant" to table: "customer_addresses"
CREATE INDEX "idx_customer_addresses_tenant" ON "storefront"."customer_addresses" ("tenant_id");
-- Create index "uq_cust_default_addr" to table: "customer_addresses"
CREATE UNIQUE INDEX "uq_cust_default_addr" ON "storefront"."customer_addresses" ("tenant_id", "customer_id") WHERE (is_default = true);
-- Create "customer_consents" table
CREATE TABLE "storefront"."customer_consents" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "consented_at" timestamptz NOT NULL DEFAULT now(),
  "revoked_at" timestamptz NULL,
  "consented" boolean NOT NULL,
  "channel" "public"."consent_channel" NOT NULL,
  "source" character varying(50) NULL,
  "ip_address" inet NULL,
  "user_agent" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_customer_consents_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_consent_cust" FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "storefront"."customers" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_consent_customer" to table: "customer_consents"
CREATE INDEX "idx_consent_customer" ON "storefront"."customer_consents" ("customer_id");
-- Create index "idx_customer_consents_tenant" to table: "customer_consents"
CREATE INDEX "idx_customer_consents_tenant" ON "storefront"."customer_consents" ("tenant_id");
-- Create "price_rules" table
CREATE TABLE "storefront"."price_rules" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "starts_at" timestamptz NULL,
  "ends_at" timestamptz NULL,
  "value" numeric(12,4) NOT NULL,
  "min_purchase_amount" numeric(12,4) NULL,
  "min_quantity" integer NULL,
  "max_uses" integer NULL,
  "max_uses_per_customer" integer NULL,
  "used_count" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "type" "public"."discount_type" NOT NULL,
  "applies_to" "public"."discount_applies_to" NOT NULL DEFAULT 'all',
  "title" jsonb NOT NULL,
  "entitled_ids" jsonb NULL,
  "combines_with" jsonb NULL,
  "lock_version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_price_rule" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_entitled_array" CHECK ((entitled_ids IS NULL) OR (jsonb_typeof(entitled_ids) = 'array'::text)),
  CONSTRAINT "chk_entitled_len" CHECK ((entitled_ids IS NULL) OR (jsonb_array_length(entitled_ids) <= 5000)),
  CONSTRAINT "chk_pr_dates" CHECK ((ends_at IS NULL) OR (ends_at > starts_at))
);
-- Create index "idx_price_rules_active" to table: "price_rules"
CREATE INDEX "idx_price_rules_active" ON "storefront"."price_rules" ("is_active");
-- Create index "idx_price_rules_tenant" to table: "price_rules"
CREATE INDEX "idx_price_rules_tenant" ON "storefront"."price_rules" ("tenant_id");
-- Create "discount_codes" table
CREATE TABLE "storefront"."discount_codes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "price_rule_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "used_count" integer NOT NULL DEFAULT 0,
  "code" character varying(50) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "discount_codes_code_unique" UNIQUE ("tenant_id", "code"),
  CONSTRAINT "uq_tenant_discount_codes_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_dc_price_rule" FOREIGN KEY ("tenant_id", "price_rule_id") REFERENCES "storefront"."price_rules" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_code_strict" CHECK (((code)::text = upper((code)::text)) AND ((code)::text ~ '^[A-Z0-9_-]+$'::text))
);
-- Create index "idx_discount_code" to table: "discount_codes"
CREATE INDEX "idx_discount_code" ON "storefront"."discount_codes" ("code");
-- Create index "idx_discount_codes_tenant" to table: "discount_codes"
CREATE INDEX "idx_discount_codes_tenant" ON "storefront"."discount_codes" ("tenant_id");
-- Create "faq_categories" table
CREATE TABLE "storefront"."faq_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" character varying(100) NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_faq_categories_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_faq_categories_tenant" to table: "faq_categories"
CREATE INDEX "idx_faq_categories_tenant" ON "storefront"."faq_categories" ("tenant_id");
-- Create "faqs" table
CREATE TABLE "storefront"."faqs" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "category_id" uuid NULL,
  "question" character varying(500) NOT NULL,
  "answer" text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_faqs_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_faq_category" FOREIGN KEY ("category_id") REFERENCES "storefront"."faq_categories" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "idx_faq_active" to table: "faqs"
CREATE INDEX "idx_faq_active" ON "storefront"."faqs" ("is_active");
-- Create index "idx_faq_category" to table: "faqs"
CREATE INDEX "idx_faq_category" ON "storefront"."faqs" ("category_id");
-- Create index "idx_faqs_tenant" to table: "faqs"
CREATE INDEX "idx_faqs_tenant" ON "storefront"."faqs" ("tenant_id");
-- Create "flash_sales" table
CREATE TABLE "storefront"."flash_sales" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "starts_at" timestamptz NOT NULL DEFAULT now(),
  "end_time" timestamptz NOT NULL,
  "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
  "is_active" boolean NOT NULL DEFAULT true,
  "name" jsonb NOT NULL,
  "status" character varying(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_flash_sale" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_flash_time" CHECK (end_time > starts_at)
);
-- Create index "idx_flash_sales_end_time" to table: "flash_sales"
CREATE INDEX "idx_flash_sales_end_time" ON "storefront"."flash_sales" ("end_time");
-- Create index "idx_flash_sales_status" to table: "flash_sales"
CREATE INDEX "idx_flash_sales_status" ON "storefront"."flash_sales" ("status");
-- Create index "idx_flash_sales_tenant" to table: "flash_sales"
CREATE INDEX "idx_flash_sales_tenant" ON "storefront"."flash_sales" ("tenant_id");
-- Create "flash_sale_products" table
CREATE TABLE "storefront"."flash_sale_products" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "flash_sale_id" uuid NULL,
  "product_id" uuid NULL,
  "discount_basis_points" integer NOT NULL,
  "quantity_limit" integer NOT NULL,
  "sold_quantity" integer NOT NULL DEFAULT 0,
  "sort_order" integer NOT NULL DEFAULT 0,
  "valid_during" tstzrange NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_flash_sale_products_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_fsp_flash_sale" FOREIGN KEY ("tenant_id", "flash_sale_id") REFERENCES "storefront"."flash_sales" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_flash_limit" CHECK (sold_quantity <= quantity_limit)
);
-- Create index "idx_flash_sale_products_tenant" to table: "flash_sale_products"
CREATE INDEX "idx_flash_sale_products_tenant" ON "storefront"."flash_sale_products" ("tenant_id");
-- Create index "idx_fs_prod_campaign" to table: "flash_sale_products"
CREATE INDEX "idx_fs_prod_campaign" ON "storefront"."flash_sale_products" ("flash_sale_id");
-- Create index "idx_fs_prod_product" to table: "flash_sale_products"
CREATE INDEX "idx_fs_prod_product" ON "storefront"."flash_sale_products" ("product_id");
-- Create "orders" table
CREATE TABLE "storefront"."orders" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NULL,
  "market_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "shipped_at" timestamptz NULL,
  "delivered_at" timestamptz NULL,
  "cancelled_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "subtotal" numeric(12,4) NOT NULL,
  "discount" numeric(12,4) NOT NULL DEFAULT 0,
  "shipping" numeric(12,4) NOT NULL DEFAULT 0,
  "tax" numeric(12,4) NOT NULL DEFAULT 0,
  "total" numeric(12,4) NOT NULL,
  "coupon_discount" numeric(12,4) NOT NULL DEFAULT 0,
  "refunded_amount" numeric(12,4) NOT NULL DEFAULT 0,
  "risk_score" integer NULL,
  "is_flagged" boolean NOT NULL DEFAULT false,
  "status" "public"."order_status" NOT NULL DEFAULT 'pending',
  "payment_status" "public"."payment_status" NOT NULL DEFAULT 'pending',
  "payment_method" "public"."payment_method" NULL,
  "source" "public"."order_source" NOT NULL DEFAULT 'web',
  "order_number" character varying(20) NOT NULL,
  "coupon_code" character varying(50) NULL,
  "tracking_number" character varying(100) NULL,
  "guest_email" character varying(255) NULL,
  "cancel_reason" text NULL,
  "ip_address" inet NULL,
  "user_agent" text NULL,
  "tracking_url" text NULL,
  "notes" text NULL,
  "tags" text NULL,
  "shipping_address" jsonb NOT NULL,
  "billing_address" jsonb NOT NULL,
  "version" bigint NOT NULL DEFAULT 1,
  "lock_version" integer NOT NULL DEFAULT 1,
  "idempotency_key" character varying(100) NULL,
  "device_fingerprint" character varying(64) NULL,
  "payment_gateway_reference" character varying(255) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_order" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ord_customer" FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "storefront"."customers" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_checkout_math" CHECK (COALESCE(total, (0)::numeric) = ((((COALESCE(subtotal, (0)::numeric) + COALESCE(tax, (0)::numeric)) + COALESCE(shipping, (0)::numeric)) - COALESCE(discount, (0)::numeric)) - COALESCE(coupon_discount, (0)::numeric))),
  CONSTRAINT "chk_order_total_inner" CHECK ((total IS NOT NULL) AND (subtotal IS NOT NULL)),
  CONSTRAINT "chk_positive_costs" CHECK ((COALESCE(shipping, (0)::numeric) >= (0)::numeric) AND (COALESCE(tax, (0)::numeric) >= (0)::numeric)),
  CONSTRAINT "chk_refund_cap" CHECK (COALESCE(refunded_amount, (0)::numeric) <= COALESCE(total, (0)::numeric))
);
-- Create index "idx_orders_admin" to table: "orders"
CREATE INDEX "idx_orders_admin" ON "storefront"."orders" ("status", "created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_orders_created" to table: "orders"
CREATE INDEX "idx_orders_created" ON "storefront"."orders" USING BRIN ("created_at");
-- Create index "idx_orders_customer" to table: "orders"
CREATE INDEX "idx_orders_customer" ON "storefront"."orders" ("customer_id");
-- Create index "idx_orders_idempotency" to table: "orders"
CREATE UNIQUE INDEX "idx_orders_idempotency" ON "storefront"."orders" ("tenant_id", "idempotency_key") WHERE (idempotency_key IS NOT NULL);
-- Create index "idx_orders_number_active" to table: "orders"
CREATE UNIQUE INDEX "idx_orders_number_active" ON "storefront"."orders" ("tenant_id", "order_number") WHERE (deleted_at IS NULL);
-- Create index "idx_orders_payment_ref" to table: "orders"
CREATE INDEX "idx_orders_payment_ref" ON "storefront"."orders" ("tenant_id", "payment_gateway_reference") WHERE (payment_gateway_reference IS NOT NULL);
-- Create index "idx_orders_tenant" to table: "orders"
CREATE INDEX "idx_orders_tenant" ON "storefront"."orders" ("tenant_id");
-- Create "fulfillments" table
CREATE TABLE "storefront"."fulfillments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "location_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "shipped_at" timestamptz NULL,
  "delivered_at" timestamptz NULL,
  "status" "public"."fulfillment_status" NOT NULL DEFAULT 'pending',
  "tracking_company" character varying(100) NULL,
  "tracking_details" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_fulfillments_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ful_order" FOREIGN KEY ("tenant_id", "order_id") REFERENCES "storefront"."orders" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_fulfillments_order" to table: "fulfillments"
CREATE INDEX "idx_fulfillments_order" ON "storefront"."fulfillments" ("order_id");
-- Create index "idx_fulfillments_tenant" to table: "fulfillments"
CREATE INDEX "idx_fulfillments_tenant" ON "storefront"."fulfillments" ("tenant_id");
-- Create "product_variants" table
CREATE TABLE "storefront"."product_variants" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "deleted_at" timestamptz NULL,
  "price" numeric(12,4) NOT NULL,
  "compare_at_price" numeric(12,4) NULL,
  "weight" integer NULL,
  "version" integer NOT NULL DEFAULT 1,
  "sku" character varying(100) NOT NULL,
  "barcode" character varying(50) NULL,
  "weight_unit" character varying(5) NOT NULL DEFAULT 'g',
  "image_url" text NULL,
  "options" jsonb NOT NULL,
  "embedding" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_variant" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_var_prod" FOREIGN KEY ("tenant_id", "product_id") REFERENCES "storefront"."products" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_variant_compare_price" CHECK ((compare_at_price IS NULL) OR (compare_at_price IS NOT NULL)),
  CONSTRAINT "chk_variant_options_obj" CHECK (jsonb_typeof(options) = 'object'::text),
  CONSTRAINT "chk_variant_price_pos" CHECK ((price >= (0)::numeric) AND (price IS NOT NULL) AND (price IS NOT NULL))
);
-- Create index "idx_variant_sku_active" to table: "product_variants"
CREATE UNIQUE INDEX "idx_variant_sku_active" ON "storefront"."product_variants" ("tenant_id", "sku") WHERE (deleted_at IS NULL);
-- Create index "idx_variants_embedding_cosine" to table: "product_variants"
CREATE INDEX "idx_variants_embedding_cosine" ON "storefront"."product_variants" ("embedding");
-- Create index "idx_variants_product" to table: "product_variants"
CREATE INDEX "idx_variants_product" ON "storefront"."product_variants" ("product_id");
-- Create index "idx_variants_tenant" to table: "product_variants"
CREATE INDEX "idx_variants_tenant" ON "storefront"."product_variants" ("tenant_id");
-- Create "order_items" table
CREATE TABLE "storefront"."order_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "product_id" uuid NULL,
  "variant_id" uuid NULL,
  "price" numeric(12,4) NOT NULL,
  "cost_price" numeric(12,4) NULL,
  "total" numeric(12,4) NOT NULL,
  "discount_amount" numeric(12,4) NOT NULL DEFAULT 0,
  "tax_amount" numeric(12,4) NOT NULL DEFAULT 0,
  "quantity" integer NOT NULL,
  "fulfilled_quantity" integer NOT NULL DEFAULT 0,
  "returned_quantity" integer NOT NULL DEFAULT 0,
  "name" character varying(255) NOT NULL,
  "sku" character varying(100) NULL,
  "image_url" text NULL,
  "attributes" jsonb NULL,
  "tax_lines" jsonb NOT NULL DEFAULT '[]',
  "discount_allocations" jsonb NOT NULL DEFAULT '[]',
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_order_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_oi_order" FOREIGN KEY ("tenant_id", "order_id") REFERENCES "storefront"."orders" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_oi_variant" FOREIGN KEY ("tenant_id", "variant_id") REFERENCES "storefront"."product_variants" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_fulfill_qty" CHECK (fulfilled_quantity <= quantity),
  CONSTRAINT "chk_item_discount_logic" CHECK (COALESCE(discount_amount, (0)::numeric) <= (COALESCE(price, (0)::numeric) * (quantity)::numeric)),
  CONSTRAINT "chk_item_inner_not_null" CHECK ((price IS NOT NULL) AND (total IS NOT NULL)),
  CONSTRAINT "chk_item_math" CHECK (COALESCE(total, (0)::numeric) = (((COALESCE(price, (0)::numeric) * (quantity)::numeric) - COALESCE(discount_amount, (0)::numeric)) + COALESCE(tax_amount, (0)::numeric))),
  CONSTRAINT "chk_returned_qty" CHECK (returned_quantity <= fulfilled_quantity),
  CONSTRAINT "qty_positive" CHECK (quantity > 0)
);
-- Create index "idx_oi_product" to table: "order_items"
CREATE INDEX "idx_oi_product" ON "storefront"."order_items" ("tenant_id", "product_id");
-- Create index "idx_order_items_order" to table: "order_items"
CREATE INDEX "idx_order_items_order" ON "storefront"."order_items" ("order_id");
-- Create index "idx_order_items_tenant" to table: "order_items"
CREATE INDEX "idx_order_items_tenant" ON "storefront"."order_items" ("tenant_id");
-- Create "fulfillment_items" table
CREATE TABLE "storefront"."fulfillment_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "fulfillment_id" uuid NOT NULL,
  "order_item_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_fulfillment_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_fi_fulfillment" FOREIGN KEY ("fulfillment_id") REFERENCES "storefront"."fulfillments" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_fi_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_fulfill_items" to table: "fulfillment_items"
CREATE INDEX "idx_fulfill_items" ON "storefront"."fulfillment_items" ("fulfillment_id");
-- Create index "idx_fulfillment_items_tenant" to table: "fulfillment_items"
CREATE INDEX "idx_fulfillment_items_tenant" ON "storefront"."fulfillment_items" ("tenant_id");
-- Create "locations" table
CREATE TABLE "storefront"."locations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "type" "public"."location_type" NOT NULL DEFAULT 'warehouse',
  "name" jsonb NOT NULL,
  "address" jsonb NULL,
  "coordinates" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_loc" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_locations_tenant" to table: "locations"
CREATE INDEX "idx_locations_tenant" ON "storefront"."locations" ("tenant_id");
-- Create "inventory_levels" table
CREATE TABLE "storefront"."inventory_levels" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "available" integer NOT NULL DEFAULT 0,
  "reserved" integer NOT NULL DEFAULT 0,
  "incoming" integer NOT NULL DEFAULT 0,
  "version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_inventory_loc_var" UNIQUE ("location_id", "variant_id"),
  CONSTRAINT "uq_tenant_inventory_levels_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_inv_loc" FOREIGN KEY ("tenant_id", "location_id") REFERENCES "storefront"."locations" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_inv_variant" FOREIGN KEY ("tenant_id", "variant_id") REFERENCES "storefront"."product_variants" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_available" CHECK (available >= 0),
  CONSTRAINT "chk_incoming_positive" CHECK (incoming >= 0),
  CONSTRAINT "chk_reserved" CHECK (reserved >= 0),
  CONSTRAINT "chk_reserved_logic" CHECK (reserved <= available)
);
-- Create index "idx_inv_variant" to table: "inventory_levels"
CREATE INDEX "idx_inv_variant" ON "storefront"."inventory_levels" ("variant_id");
-- Create index "idx_inventory_tenant" to table: "inventory_levels"
CREATE INDEX "idx_inventory_tenant" ON "storefront"."inventory_levels" ("tenant_id");
-- Create "inventory_movements" table
CREATE TABLE "storefront"."inventory_movements" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "created_by" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "type" "public"."inventory_movement_type" NOT NULL,
  "quantity" integer NOT NULL,
  "reason" text NULL,
  "reference_id" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_inventory_movements_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_im_loc" FOREIGN KEY ("tenant_id", "location_id") REFERENCES "storefront"."locations" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_im_variant" FOREIGN KEY ("tenant_id", "variant_id") REFERENCES "storefront"."product_variants" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_adj_reason" CHECK ((type <> 'adjustment'::public.inventory_movement_type) OR (reference_id IS NOT NULL)),
  CONSTRAINT "chk_movement_logic" CHECK (((type = 'in'::public.inventory_movement_type) AND (quantity > 0)) OR ((type = 'out'::public.inventory_movement_type) AND (quantity < 0)) OR (type = ANY (ARRAY['adjustment'::public.inventory_movement_type, 'transfer'::public.inventory_movement_type, 'return'::public.inventory_movement_type]))),
  CONSTRAINT "chk_return_positive" CHECK ((type <> 'return'::public.inventory_movement_type) OR (quantity > 0))
);
-- Create index "idx_inv_mov_created" to table: "inventory_movements"
CREATE INDEX "idx_inv_mov_created" ON "storefront"."inventory_movements" USING BRIN ("created_at");
-- Create index "idx_inv_mov_tenant" to table: "inventory_movements"
CREATE INDEX "idx_inv_mov_tenant" ON "storefront"."inventory_movements" ("tenant_id");
-- Create index "idx_inv_mov_variant" to table: "inventory_movements"
CREATE INDEX "idx_inv_mov_variant" ON "storefront"."inventory_movements" ("variant_id");
-- Create "inventory_reservations" table
CREATE TABLE "storefront"."inventory_reservations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "status" "public"."reservation_status" NOT NULL DEFAULT 'active',
  "cart_id" uuid NULL,
  "quantity" integer NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_inventory_reservations_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ir_loc" FOREIGN KEY ("tenant_id", "location_id") REFERENCES "storefront"."locations" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_ir_variant" FOREIGN KEY ("tenant_id", "variant_id") REFERENCES "storefront"."product_variants" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_res_qty_limit" CHECK (quantity <= 100),
  CONSTRAINT "chk_res_time_bound" CHECK (expires_at <= (created_at + '7 days'::interval))
);
-- Create index "idx_inv_res_active" to table: "inventory_reservations"
CREATE INDEX "idx_inv_res_active" ON "storefront"."inventory_reservations" ("status") WHERE (status = 'active'::public.reservation_status);
-- Create index "idx_inv_res_cron" to table: "inventory_reservations"
CREATE INDEX "idx_inv_res_cron" ON "storefront"."inventory_reservations" ("expires_at") WHERE (status = 'active'::public.reservation_status);
-- Create index "idx_inv_res_tenant" to table: "inventory_reservations"
CREATE INDEX "idx_inv_res_tenant" ON "storefront"."inventory_reservations" ("tenant_id");
-- Create "inventory_transfers" table
CREATE TABLE "storefront"."inventory_transfers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "from_location_id" uuid NOT NULL,
  "to_location_id" uuid NOT NULL,
  "created_by" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expected_arrival" timestamptz NULL,
  "status" "public"."transfer_status" NOT NULL DEFAULT 'draft',
  "notes" text NULL,
  "version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_inventory_transfers_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_it_from_loc" FOREIGN KEY ("tenant_id", "from_location_id") REFERENCES "storefront"."locations" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_it_to_loc" FOREIGN KEY ("tenant_id", "to_location_id") REFERENCES "storefront"."locations" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_transfer_future" CHECK ((expected_arrival IS NULL) OR (expected_arrival >= created_at)),
  CONSTRAINT "chk_transfer_locations" CHECK (from_location_id <> to_location_id)
);
-- Create index "idx_inv_tra_tenant" to table: "inventory_transfers"
CREATE INDEX "idx_inv_tra_tenant" ON "storefront"."inventory_transfers" ("tenant_id");
-- Create "inventory_transfer_items" table
CREATE TABLE "storefront"."inventory_transfer_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "transfer_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_inventory_transfer_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_iti_transfer" FOREIGN KEY ("transfer_id") REFERENCES "storefront"."inventory_transfers" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_iti_variant" FOREIGN KEY ("tenant_id", "variant_id") REFERENCES "storefront"."product_variants" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_inv_tra_items_tenant" to table: "inventory_transfer_items"
CREATE INDEX "idx_inv_tra_items_tenant" ON "storefront"."inventory_transfer_items" ("tenant_id");
-- Create index "idx_transfer_items" to table: "inventory_transfer_items"
CREATE INDEX "idx_transfer_items" ON "storefront"."inventory_transfer_items" ("transfer_id");
-- Create "kb_categories" table
CREATE TABLE "storefront"."kb_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "slug" character varying(255) NOT NULL,
  "icon" character varying(50) NULL,
  "order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "kb_categories_slug_unique" UNIQUE ("tenant_id", "slug"),
  CONSTRAINT "uq_tenant_kb_categories_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_kb_categories_tenant" to table: "kb_categories"
CREATE INDEX "idx_kb_categories_tenant" ON "storefront"."kb_categories" ("tenant_id");
-- Create "kb_articles" table
CREATE TABLE "storefront"."kb_articles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "category_id" uuid NULL,
  "slug" character varying(255) NOT NULL,
  "title" character varying(255) NOT NULL,
  "content" text NOT NULL,
  "is_published" boolean NOT NULL DEFAULT true,
  "view_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "kb_articles_slug_unique" UNIQUE ("tenant_id", "slug"),
  CONSTRAINT "uq_tenant_kb_articles_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_kba_category" FOREIGN KEY ("category_id") REFERENCES "storefront"."kb_categories" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_kb_article_slug" to table: "kb_articles"
CREATE INDEX "idx_kb_article_slug" ON "storefront"."kb_articles" ("slug");
-- Create index "idx_kb_articles_tenant" to table: "kb_articles"
CREATE INDEX "idx_kb_articles_tenant" ON "storefront"."kb_articles" ("tenant_id");
-- Create "order_edits" table
CREATE TABLE "storefront"."order_edits" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "line_item_id" uuid NULL,
  "edited_by" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "amount_change" numeric(12,4) NOT NULL DEFAULT 0,
  "edit_type" character varying(30) NOT NULL,
  "reason" text NULL,
  "old_value" jsonb NULL,
  "new_value" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_order_edits_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_oe_line_item" FOREIGN KEY ("line_item_id") REFERENCES "storefront"."order_items" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_oe_order" FOREIGN KEY ("tenant_id", "order_id") REFERENCES "storefront"."orders" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_order_edits" to table: "order_edits"
CREATE INDEX "idx_order_edits" ON "storefront"."order_edits" ("order_id");
-- Create index "idx_order_edits_tenant" to table: "order_edits"
CREATE INDEX "idx_order_edits_tenant" ON "storefront"."order_edits" ("tenant_id");
-- Create "order_timeline" table
CREATE TABLE "storefront"."order_timeline" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NULL,
  "updated_by" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "status" character varying(50) NOT NULL,
  "title" jsonb NULL,
  "notes" text NULL,
  "location" jsonb NULL,
  "ip_address" inet NULL,
  "user_agent" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_order_timeline_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ot_order" FOREIGN KEY ("tenant_id", "order_id") REFERENCES "storefront"."orders" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_order_timeline_tenant" to table: "order_timeline"
CREATE INDEX "idx_order_timeline_tenant" ON "storefront"."order_timeline" ("tenant_id");
-- Create index "idx_timeline_created" to table: "order_timeline"
CREATE INDEX "idx_timeline_created" ON "storefront"."order_timeline" USING BRIN ("created_at");
-- Create index "idx_timeline_order" to table: "order_timeline"
CREATE INDEX "idx_timeline_order" ON "storefront"."order_timeline" ("order_id");
-- Create "payment_logs" table
CREATE TABLE "storefront"."payment_logs" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "provider" character varying(50) NOT NULL,
  "transaction_id" character varying(255) NULL,
  "provider_reference_id" character varying(255) NULL,
  "status" character varying(20) NOT NULL,
  "amount" numeric(12,4) NOT NULL,
  "error_code" character varying(100) NULL,
  "error_message" text NULL,
  "raw_response" jsonb NULL,
  "idempotency_key" character varying(100) NULL,
  "ip_address" inet NULL,
  PRIMARY KEY ("id", "created_at"),
  CONSTRAINT "uq_tenant_payment_logs_composite" UNIQUE ("tenant_id", "id", "created_at"),
  CONSTRAINT "fk_pl_order" FOREIGN KEY ("tenant_id", "order_id") REFERENCES "storefront"."orders" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
) PARTITION BY RANGE ("created_at");
-- Create index "idx_payment_created_brin" to table: "payment_logs"
CREATE INDEX "idx_payment_created_brin" ON "storefront"."payment_logs" USING BRIN ("created_at");
-- Create index "idx_payment_logs_order" to table: "payment_logs"
CREATE INDEX "idx_payment_logs_order" ON "storefront"."payment_logs" ("order_id");
-- Create index "idx_payment_logs_tenant" to table: "payment_logs"
CREATE INDEX "idx_payment_logs_tenant" ON "storefront"."payment_logs" ("tenant_id");
-- Create "markets" table
CREATE TABLE "storefront"."markets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_primary" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "default_currency" character(3) NOT NULL,
  "default_language" character(2) NOT NULL DEFAULT 'ar',
  "name" jsonb NOT NULL,
  "countries" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_markets_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_markets_tenant_active" to table: "markets"
CREATE INDEX "idx_markets_tenant_active" ON "storefront"."markets" ("tenant_id");
-- Create index "uq_tenant_primary_market" to table: "markets"
CREATE UNIQUE INDEX "uq_tenant_primary_market" ON "storefront"."markets" ("tenant_id") WHERE (is_primary = true);
-- Create "price_lists" table
CREATE TABLE "storefront"."price_lists" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "market_id" uuid NOT NULL,
  "product_id" uuid NULL,
  "variant_id" uuid NULL,
  "quantity_range" int4range NOT NULL,
  "price" numeric(12,4) NOT NULL,
  "compare_at_price" numeric(12,4) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_price_lists_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_pl_market" FOREIGN KEY ("tenant_id", "market_id") REFERENCES "storefront"."markets" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_pl_inner_not_null" CHECK ((price IS NOT NULL) AND (price IS NOT NULL)),
  CONSTRAINT "chk_pl_price_inner" CHECK ((price IS NOT NULL) AND (price IS NOT NULL))
);
-- Create index "idx_price_lists_tenant_active" to table: "price_lists"
CREATE INDEX "idx_price_lists_tenant_active" ON "storefront"."price_lists" ("tenant_id");
-- Create "product_attributes" table
CREATE TABLE "storefront"."product_attributes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "attribute_name" character varying(100) NOT NULL,
  "attribute_value" text NOT NULL,
  "attribute_group" character varying(100) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_product_attr" UNIQUE ("tenant_id", "product_id", "attribute_name"),
  CONSTRAINT "uq_tenant_product_attributes_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_attr_prod" FOREIGN KEY ("tenant_id", "product_id") REFERENCES "storefront"."products" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "chk_attr_val_len" CHECK (length(attribute_value) <= 1024)
);
-- Create index "idx_attrs_product" to table: "product_attributes"
CREATE INDEX "idx_attrs_product" ON "storefront"."product_attributes" ("product_id", "attribute_name");
-- Create index "idx_product_attributes_tenant" to table: "product_attributes"
CREATE INDEX "idx_product_attributes_tenant" ON "storefront"."product_attributes" ("tenant_id");
-- Create "product_bundles" table
CREATE TABLE "storefront"."product_bundles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "starts_at" timestamptz NULL,
  "ends_at" timestamptz NULL,
  "discount_value" numeric(12,4) NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "discount_type" character varying(20) NOT NULL DEFAULT 'percentage',
  "name" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_bundle" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_bundle_discount_positive" CHECK (COALESCE(discount_value, (0)::numeric) >= (0)::numeric)
);
-- Create index "idx_product_bundles_tenant" to table: "product_bundles"
CREATE INDEX "idx_product_bundles_tenant" ON "storefront"."product_bundles" ("tenant_id");
-- Create "product_bundle_items" table
CREATE TABLE "storefront"."product_bundle_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "bundle_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_product_bundle_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_pbi_bundle" FOREIGN KEY ("tenant_id", "bundle_id") REFERENCES "storefront"."product_bundles" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_bundle_items" to table: "product_bundle_items"
CREATE INDEX "idx_bundle_items" ON "storefront"."product_bundle_items" ("bundle_id");
-- Create index "idx_product_bundle_items_tenant" to table: "product_bundle_items"
CREATE INDEX "idx_product_bundle_items_tenant" ON "storefront"."product_bundle_items" ("tenant_id");
-- Create "product_images" table
CREATE TABLE "storefront"."product_images" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "url" text NOT NULL,
  "alt_text" character varying(255) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_product_images_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_img_prod" FOREIGN KEY ("tenant_id", "product_id") REFERENCES "storefront"."products" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_product_images_product" to table: "product_images"
CREATE INDEX "idx_product_images_product" ON "storefront"."product_images" ("product_id");
-- Create index "idx_product_images_tenant" to table: "product_images"
CREATE INDEX "idx_product_images_tenant" ON "storefront"."product_images" ("tenant_id");
-- Create index "uq_primary_image" to table: "product_images"
CREATE UNIQUE INDEX "uq_primary_image" ON "storefront"."product_images" ("tenant_id", "product_id") WHERE (is_primary = true);
-- Create "suppliers" table
CREATE TABLE "storefront"."suppliers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "lead_time_days" integer NOT NULL DEFAULT 7,
  "currency" character(3) NOT NULL DEFAULT 'USD',
  "name" text NOT NULL,
  "email" jsonb NULL,
  "phone" jsonb NULL,
  "company" jsonb NULL,
  "notes" text NULL,
  "address" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_suppliers_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_sup_company_s7" CHECK ((company IS NULL) OR ((jsonb_typeof(company) = 'object'::text) AND (company ? 'enc'::text) AND (company ? 'iv'::text) AND (company ? 'tag'::text) AND (company ? 'data'::text))),
  CONSTRAINT "chk_sup_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
  CONSTRAINT "chk_sup_phone_s7" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text)))
);
-- Create index "idx_suppliers_tenant" to table: "suppliers"
CREATE INDEX "idx_suppliers_tenant" ON "storefront"."suppliers" ("tenant_id");
-- Create "purchase_orders" table
CREATE TABLE "storefront"."purchase_orders" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "supplier_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expected_arrival" timestamptz NULL,
  "status" "public"."purchase_order_status" NOT NULL DEFAULT 'draft',
  "subtotal" numeric(12,4) NOT NULL,
  "tax" numeric(12,4) NOT NULL DEFAULT 0,
  "shipping_cost" numeric(12,4) NOT NULL DEFAULT 0,
  "total" numeric(12,4) NOT NULL,
  "order_number" character varying(20) NULL,
  "notes" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "idx_po_number_unique" UNIQUE ("tenant_id", "order_number"),
  CONSTRAINT "uq_tenant_purchase_orders_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_po_location" FOREIGN KEY ("tenant_id", "location_id") REFERENCES "storefront"."locations" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_po_supplier" FOREIGN KEY ("supplier_id") REFERENCES "storefront"."suppliers" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_po_inner_not_null" CHECK ((total IS NOT NULL) AND (subtotal IS NOT NULL)),
  CONSTRAINT "chk_po_math" CHECK (COALESCE(total, (0)::numeric) = ((COALESCE(subtotal, (0)::numeric) + COALESCE(tax, (0)::numeric)) + COALESCE(shipping_cost, (0)::numeric)))
);
-- Create index "idx_po_status" to table: "purchase_orders"
CREATE INDEX "idx_po_status" ON "storefront"."purchase_orders" ("status");
-- Create index "idx_po_supplier" to table: "purchase_orders"
CREATE INDEX "idx_po_supplier" ON "storefront"."purchase_orders" ("supplier_id");
-- Create index "idx_purchase_orders_tenant" to table: "purchase_orders"
CREATE INDEX "idx_purchase_orders_tenant" ON "storefront"."purchase_orders" ("tenant_id");
-- Create "purchase_order_items" table
CREATE TABLE "storefront"."purchase_order_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "po_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "quantity_ordered" integer NOT NULL,
  "quantity_received" integer NOT NULL DEFAULT 0,
  "unit_cost" numeric(12,4) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_purchase_order_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_poi_po" FOREIGN KEY ("po_id") REFERENCES "storefront"."purchase_orders" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_poi_variant" FOREIGN KEY ("tenant_id", "variant_id") REFERENCES "storefront"."product_variants" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_po_receive" CHECK (quantity_received <= quantity_ordered),
  CONSTRAINT "qty_positive" CHECK (quantity_ordered > 0)
);
-- Create index "idx_po_items" to table: "purchase_order_items"
CREATE INDEX "idx_po_items" ON "storefront"."purchase_order_items" ("po_id");
-- Create index "idx_poi_tenant" to table: "purchase_order_items"
CREATE INDEX "idx_poi_tenant" ON "storefront"."purchase_order_items" ("tenant_id");
-- Create "refunds" table
CREATE TABLE "storefront"."refunds" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "refunded_by" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "amount" numeric(12,4) NOT NULL,
  "status" "public"."refund_status" NOT NULL DEFAULT 'pending',
  "gateway_transaction_id" character varying(255) NULL,
  "reason" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_refund" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ref_order" FOREIGN KEY ("tenant_id", "order_id") REFERENCES "storefront"."orders" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_refund_positive" CHECK (COALESCE(amount, (0)::numeric) > (0)::numeric)
);
-- Create index "idx_refunds_order" to table: "refunds"
CREATE INDEX "idx_refunds_order" ON "storefront"."refunds" ("order_id");
-- Create index "idx_refunds_tenant" to table: "refunds"
CREATE INDEX "idx_refunds_tenant" ON "storefront"."refunds" ("tenant_id");
-- Create "refund_items" table
CREATE TABLE "storefront"."refund_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "refund_id" uuid NOT NULL,
  "order_item_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "amount" numeric(12,4) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_refund_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ri_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_ri_refund" FOREIGN KEY ("tenant_id", "refund_id") REFERENCES "storefront"."refunds" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_refund_item_amt" CHECK ((COALESCE(amount, (0)::numeric) > (0)::numeric) AND (quantity > 0))
);
-- Create index "idx_refund_items" to table: "refund_items"
CREATE INDEX "idx_refund_items" ON "storefront"."refund_items" ("refund_id");
-- Create index "idx_refund_items_tenant" to table: "refund_items"
CREATE INDEX "idx_refund_items_tenant" ON "storefront"."refund_items" ("tenant_id");
-- Create "rma_requests" table
CREATE TABLE "storefront"."rma_requests" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "order_item_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "reason_code" "public"."rma_reason_code" NOT NULL,
  "condition" "public"."rma_condition" NOT NULL DEFAULT 'new',
  "resolution" "public"."rma_resolution" NOT NULL DEFAULT 'refund',
  "status" character varying(20) NOT NULL DEFAULT 'pending',
  "description" text NULL,
  "evidence" jsonb NOT NULL DEFAULT '[]',
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_rma" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_rma_order" FOREIGN KEY ("tenant_id", "order_id") REFERENCES "storefront"."orders" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_rma_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_rma_order" to table: "rma_requests"
CREATE INDEX "idx_rma_order" ON "storefront"."rma_requests" ("order_id");
-- Create index "idx_rma_requests_tenant" to table: "rma_requests"
CREATE INDEX "idx_rma_requests_tenant" ON "storefront"."rma_requests" ("tenant_id");
-- Create index "idx_rma_status" to table: "rma_requests"
CREATE INDEX "idx_rma_status" ON "storefront"."rma_requests" ("status");
-- Create "rma_items" table
CREATE TABLE "storefront"."rma_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "rma_id" uuid NOT NULL,
  "order_item_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "restocking_fee" numeric(12,4) NOT NULL DEFAULT 0,
  "reason_code" character varying(50) NOT NULL,
  "condition" character varying(20) NOT NULL,
  "resolution" character varying(20) NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_rma_items_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_rmai_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "fk_rmai_rma" FOREIGN KEY ("tenant_id", "rma_id") REFERENCES "storefront"."rma_requests" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "qty_positive" CHECK (quantity > 0)
);
-- Create index "idx_rma_items_rma" to table: "rma_items"
CREATE INDEX "idx_rma_items_rma" ON "storefront"."rma_items" ("rma_id");
-- Create index "idx_rma_items_tenant" to table: "rma_items"
CREATE INDEX "idx_rma_items_tenant" ON "storefront"."rma_items" ("tenant_id");
-- Create "staff_roles" table
CREATE TABLE "storefront"."staff_roles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_system" boolean NOT NULL DEFAULT false,
  "name" character varying(100) NOT NULL,
  "description" text NULL,
  "permissions" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_staff_roles_composite" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_staff_roles_tenant" to table: "staff_roles"
CREATE INDEX "idx_staff_roles_tenant" ON "storefront"."staff_roles" ("tenant_id");
-- Create "staff_members" table
CREATE TABLE "storefront"."staff_members" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_login_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "deactivated_at" timestamptz NULL,
  "deactivated_by" uuid NULL,
  "email" jsonb NOT NULL,
  "first_name" character varying(100) NULL,
  "last_name" character varying(100) NULL,
  "avatar_url" text NULL,
  "phone" jsonb NULL,
  "is_2fa_enabled" boolean NOT NULL DEFAULT false,
  "two_factor_secret" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_staff" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_sm_role" FOREIGN KEY ("role_id") REFERENCES "storefront"."staff_roles" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_staff_2fa_s7" CHECK ((two_factor_secret IS NULL) OR ((jsonb_typeof(two_factor_secret) = 'object'::text) AND (two_factor_secret ? 'enc'::text) AND (two_factor_secret ? 'iv'::text) AND (two_factor_secret ? 'tag'::text) AND (two_factor_secret ? 'data'::text))),
  CONSTRAINT "chk_staff_email_s7" CHECK ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text)),
  CONSTRAINT "chk_staff_phone_s7" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text)))
);
-- Create index "idx_staff_active" to table: "staff_members"
CREATE INDEX "idx_staff_active" ON "storefront"."staff_members" ("is_active") WHERE (is_active = true);
-- Create index "idx_staff_members_tenant" to table: "staff_members"
CREATE INDEX "idx_staff_members_tenant" ON "storefront"."staff_members" ("tenant_id");
-- Create index "idx_staff_user" to table: "staff_members"
CREATE INDEX "idx_staff_user" ON "storefront"."staff_members" ("user_id");
-- Create "tenants" table
CREATE TABLE "governance"."tenants" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "trial_ends_at" timestamptz NULL,
  "suspended_at" timestamptz NULL,
  "plan" "public"."tenant_plan" NOT NULL DEFAULT 'free',
  "status" "public"."tenant_status" NOT NULL DEFAULT 'active',
  "subdomain" text NOT NULL,
  "custom_domain" text NULL,
  "name" text NOT NULL,
  "owner_email" jsonb NULL,
  "owner_email_hash" text NULL,
  "suspended_reason" text NULL,
  "niche_type" text NOT NULL DEFAULT 'retail',
  "niche_type_hash" text NULL,
  "ui_config" jsonb NOT NULL DEFAULT '{}',
  "data_region" character(2) NOT NULL DEFAULT 'SA',
  "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
  PRIMARY KEY ("id"),
  CONSTRAINT "chk_owner_email_s7" CHECK ((owner_email IS NULL) OR ((jsonb_typeof(owner_email) = 'object'::text) AND (owner_email ? 'enc'::text) AND (owner_email ? 'iv'::text) AND (owner_email ? 'tag'::text) AND (owner_email ? 'data'::text))),
  CONSTRAINT "chk_ui_config_size" CHECK (pg_column_size(ui_config) <= 204800)
);
-- Create index "idx_tenants_email_hash" to table: "tenants"
CREATE INDEX "idx_tenants_email_hash" ON "governance"."tenants" ("owner_email_hash");
-- Create index "tenants_custom_domain_unique" to table: "tenants"
CREATE UNIQUE INDEX "tenants_custom_domain_unique" ON "governance"."tenants" ("custom_domain") WHERE (deleted_at IS NULL);
-- Create index "tenants_subdomain_unique" to table: "tenants"
CREATE UNIQUE INDEX "tenants_subdomain_unique" ON "governance"."tenants" ("subdomain") WHERE (deleted_at IS NULL);
-- Create "staff_sessions" table
CREATE TABLE "storefront"."staff_sessions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "staff_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_active_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz NULL,
  "token_hash" character(64) NOT NULL,
  "device_fingerprint" character varying(64) NULL,
  "ip_address" inet NULL,
  "asn" character varying(50) NULL,
  "ip_country" character(2) NULL,
  "user_agent" text NULL,
  "session_salt_version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "staff_sessions_token_hash_unique" UNIQUE ("tenant_id", "token_hash"),
  CONSTRAINT "uq_tenant_staff_sessions_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ss_staff" FOREIGN KEY ("tenant_id", "staff_id") REFERENCES "storefront"."staff_members" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "fk_ss_tenant" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "idx_session_active" to table: "staff_sessions"
CREATE INDEX "idx_session_active" ON "storefront"."staff_sessions" ("staff_id") WHERE (revoked_at IS NULL);
-- Create index "idx_session_revocation_lookup" to table: "staff_sessions"
CREATE INDEX "idx_session_revocation_lookup" ON "storefront"."staff_sessions" ("staff_id", "device_fingerprint", "revoked_at");
-- Create index "idx_session_token" to table: "staff_sessions"
CREATE INDEX "idx_session_token" ON "storefront"."staff_sessions" USING HASH ("token_hash");
-- Create "tax_categories" table
CREATE TABLE "storefront"."tax_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "priority" integer NOT NULL DEFAULT 0,
  "is_default" boolean NOT NULL DEFAULT false,
  "name" character varying(100) NOT NULL,
  "code" character varying(50) NULL,
  "description" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_tax_category" UNIQUE ("tenant_id", "id")
);
-- Create index "idx_tax_categories_tenant" to table: "tax_categories"
CREATE INDEX "idx_tax_categories_tenant" ON "storefront"."tax_categories" ("tenant_id");
-- Create "tax_rules" table
CREATE TABLE "storefront"."tax_rules" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "tax_category_id" uuid NULL,
  "rate" integer NOT NULL,
  "priority" integer NOT NULL DEFAULT 0,
  "is_inclusive" boolean NOT NULL DEFAULT true,
  "is_active" boolean NOT NULL DEFAULT true,
  "name" character varying(100) NOT NULL,
  "country" character(2) NOT NULL,
  "state" character varying(100) NULL,
  "zip_code" character varying(20) NULL,
  "applies_to" character varying(20) NOT NULL DEFAULT 'all',
  "tax_type" character varying(50) NOT NULL DEFAULT 'VAT',
  "rounding_rule" character varying(20) NOT NULL DEFAULT 'half_even',
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tax_rule" UNIQUE ("tenant_id", "country", "state", "zip_code", "tax_type"),
  CONSTRAINT "uq_tenant_tax_rules_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_tr_tax_category" FOREIGN KEY ("tenant_id", "tax_category_id") REFERENCES "storefront"."tax_categories" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_tax_rate_bounds" CHECK ((rate >= 0) AND (rate <= 10000)),
  CONSTRAINT "chk_tax_rounding" CHECK ((rounding_rule)::text = ANY ((ARRAY['half_even'::character varying, 'half_up'::character varying, 'half_down'::character varying])::text[]))
);
-- Create index "idx_tax_rules_country" to table: "tax_rules"
CREATE INDEX "idx_tax_rules_country" ON "storefront"."tax_rules" ("country");
-- Create index "idx_tax_rules_tenant" to table: "tax_rules"
CREATE INDEX "idx_tax_rules_tenant" ON "storefront"."tax_rules" ("tenant_id");
-- Create "app_installations" table
CREATE TABLE "storefront"."app_installations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "installed_at" timestamptz NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true,
  "app_name" character varying(255) NOT NULL,
  "api_key" jsonb NULL,
  "access_token" jsonb NULL,
  "api_secret_hash" character(64) NULL,
  "webhook_url" text NULL,
  "scopes" jsonb NULL,
  "key_rotated_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_app" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "chk_app_key_s7" CHECK ((api_key IS NULL) OR ((jsonb_typeof(api_key) = 'object'::text) AND (api_key ? 'enc'::text) AND (api_key ? 'iv'::text) AND (api_key ? 'tag'::text) AND (api_key ? 'data'::text))),
  CONSTRAINT "chk_app_token_s7" CHECK ((access_token IS NULL) OR ((jsonb_typeof(access_token) = 'object'::text) AND (access_token ? 'enc'::text) AND (access_token ? 'iv'::text) AND (access_token ? 'tag'::text) AND (access_token ? 'data'::text))),
  CONSTRAINT "chk_scopes_structure" CHECK ((scopes IS NULL) OR (jsonb_typeof(scopes) = 'array'::text))
);
-- Create index "idx_app_installations_tenant" to table: "app_installations"
CREATE INDEX "idx_app_installations_tenant" ON "storefront"."app_installations" ("tenant_id");
-- Create "webhook_subscriptions" table
CREATE TABLE "storefront"."webhook_subscriptions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "app_id" uuid NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "event" character varying(100) NOT NULL,
  "target_url" text NOT NULL,
  "secret" jsonb NULL,
  "max_retries" integer NOT NULL DEFAULT 3,
  "retry_count" integer NOT NULL DEFAULT 0,
  "suspended_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "uq_tenant_webhook_subscriptions_composite" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "fk_ws_app" FOREIGN KEY ("tenant_id", "app_id") REFERENCES "storefront"."app_installations" ("tenant_id", "id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "chk_https_only" CHECK (target_url ~ '^https://'::text),
  CONSTRAINT "chk_retry_limit" CHECK (retry_count <= max_retries),
  CONSTRAINT "chk_url_length" CHECK (length(target_url) <= 2048),
  CONSTRAINT "chk_webhook_secret_s7" CHECK ((secret IS NULL) OR ((jsonb_typeof(secret) = 'object'::text) AND (secret ? 'enc'::text) AND (secret ? 'iv'::text) AND (secret ? 'tag'::text) AND (secret ? 'data'::text))),
  CONSTRAINT "webhook_secret_min_length" CHECK ((secret IS NULL) OR (octet_length((secret ->> 'enc'::text)) >= 32))
);
-- Create index "idx_webhook_app" to table: "webhook_subscriptions"
CREATE INDEX "idx_webhook_app" ON "storefront"."webhook_subscriptions" ("app_id");
-- Create index "idx_webhook_event" to table: "webhook_subscriptions"
CREATE INDEX "idx_webhook_event" ON "storefront"."webhook_subscriptions" ("event");
-- Create index "idx_webhook_subscriptions_tenant" to table: "webhook_subscriptions"
CREATE INDEX "idx_webhook_subscriptions_tenant" ON "storefront"."webhook_subscriptions" ("tenant_id");

