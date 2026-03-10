-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "governance";
--> statement-breakpoint
CREATE SCHEMA "storefront";
--> statement-breakpoint
CREATE SCHEMA "vault";
--> statement-breakpoint
CREATE SCHEMA "shared";
--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('super_admin', 'tenant_admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."affiliate_status" AS ENUM('active', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."affiliate_tx_status" AS ENUM('pending', 'approved', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."audit_result_enum" AS ENUM('SUCCESS', 'FAILURE');--> statement-breakpoint
CREATE TYPE "public"."b2b_company_status" AS ENUM('active', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."b2b_user_role" AS ENUM('admin', 'buyer', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."blueprint_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."consent_channel" AS ENUM('email', 'sms', 'push', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."discount_applies_to" AS ENUM('all', 'specific_products', 'specific_categories', 'specific_customers');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed', 'buy_x_get_y', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."dunning_status" AS ENUM('pending', 'retried', 'failed', 'recovered');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'shipped', 'in_transit', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('in', 'out', 'adjustment', 'return', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'converted');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('warehouse', 'retail', 'dropship');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('web', 'mobile', 'b2b', 'pos');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'awaiting_approval', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'cod', 'wallet', 'bnpl', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partially_refunded', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'ordered', 'partial', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('active', 'converted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."rma_condition" AS ENUM('new', 'opened', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."rma_reason_code" AS ENUM('defective', 'wrong_item', 'changed_mind', 'not_as_described', 'damaged_in_transit');--> statement-breakpoint
CREATE TYPE "public"."rma_resolution" AS ENUM('refund', 'exchange', 'store_credit');--> statement-breakpoint
CREATE TYPE "public"."rma_status" AS ENUM('requested', 'approved', 'shipped', 'received', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."severity_enum" AS ENUM('INFO', 'WARNING', 'CRITICAL', 'SECURITY_ALERT');--> statement-breakpoint
CREATE TYPE "public"."tenant_niche" AS ENUM('retail', 'wellness', 'education', 'services', 'hospitality', 'real-estate', 'creative');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'pending', 'archived');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('draft', 'in_transit', 'received', 'cancelled');--> statement-breakpoint
CREATE TABLE "storefront"."pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"slug" varchar(255) NOT NULL,
	"page_type" varchar(50) DEFAULT 'custom' NOT NULL,
	"template" varchar(50) DEFAULT 'default' NOT NULL,
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"title" jsonb NOT NULL,
	"content" jsonb,
	CONSTRAINT "chk_page_slug" CHECK ((slug)::text ~ '^[a-z0-9-]+$'::text)
);
--> statement-breakpoint
CREATE TABLE "storefront"."legal_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"page_type" text NOT NULL,
	"last_edited_by" text,
	"title" jsonb NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "uq_legal_page_type" UNIQUE("page_type"),
	CONSTRAINT "ck_legal_page_type" CHECK (page_type = ANY (ARRAY['privacy_policy'::text, 'terms_of_service'::text, 'shipping_policy'::text, 'return_policy'::text, 'cookie_policy'::text])),
	CONSTRAINT "ck_legal_version_positive" CHECK (version > 0)
);
--> statement-breakpoint
CREATE TABLE "governance"."dunning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" "dunning_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(12, 4) NOT NULL,
	"next_retry_at" timestamp with time zone,
	"payment_method" text,
	"error_message" text,
	CONSTRAINT "chk_dunning_amount" CHECK (COALESCE(amount, (0)::numeric) > (0)::numeric),
	CONSTRAINT "chk_dunning_attempts" CHECK (attempt_number <= 5)
);
--> statement-breakpoint
ALTER TABLE "governance"."dunning_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."feature_gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"plan_code" varchar(50),
	"feature_key" varchar(100) NOT NULL,
	"rollout_percentage" integer DEFAULT 100 NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "uq_feature_tenant_key" UNIQUE("tenant_id","feature_key"),
	CONSTRAINT "chk_fg_meta_size" CHECK (pg_column_size(metadata) <= 51200),
	CONSTRAINT "chk_rollout_range" CHECK ((rollout_percentage >= 0) AND (rollout_percentage <= 100))
);
--> statement-breakpoint
ALTER TABLE "governance"."feature_gates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lead_score" integer,
	"converted_tenant_id" uuid,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"email" jsonb NOT NULL,
	"email_hash" text NOT NULL,
	"name" jsonb,
	"notes" jsonb,
	"source" varchar(50),
	"landing_page_url" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"tags" jsonb NOT NULL,
	CONSTRAINT "chk_leads_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
	CONSTRAINT "chk_leads_name_s7" CHECK ((name IS NULL) OR ((jsonb_typeof(name) = 'object'::text) AND (name ? 'enc'::text) AND (name ? 'iv'::text) AND (name ? 'tag'::text) AND (name ? 'data'::text))),
	CONSTRAINT "chk_leads_notes_s7" CHECK ((notes IS NULL) OR ((jsonb_typeof(notes) = 'object'::text) AND (notes ? 'enc'::text) AND (notes ? 'iv'::text) AND (notes ? 'tag'::text) AND (notes ? 'data'::text)))
);
--> statement-breakpoint
ALTER TABLE "governance"."leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."app_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"app_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 4) NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"metric" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "governance"."app_usage_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."marketing_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"slug" text NOT NULL,
	"page_type" text DEFAULT 'landing' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"created_by" text,
	"title" jsonb NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "uq_marketing_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "governance"."onboarding_blueprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"plan" "tenant_plan" DEFAULT 'free' NOT NULL,
	"niche_type" "tenant_niche" DEFAULT 'retail' NOT NULL,
	"status" "blueprint_status" DEFAULT 'active' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"blueprint" jsonb NOT NULL,
	"ui_config" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance"."order_fraud_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"risk_score" integer NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"is_reviewed" boolean DEFAULT false NOT NULL,
	"reviewed_by" text,
	"decision" text,
	"provider" text DEFAULT 'internal' NOT NULL,
	"ml_model_version" varchar(50) DEFAULT 'v1.0.0' NOT NULL,
	"signals" jsonb NOT NULL,
	CONSTRAINT "uq_tenant_order_fraud_scores_composite" UNIQUE("id","tenant_id"),
	CONSTRAINT "chk_risk_score_range" CHECK ((risk_score >= 0) AND (risk_score <= 1000))
);
--> statement-breakpoint
ALTER TABLE "governance"."order_fraud_scores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."schema_drift_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"command_tag" text,
	"object_type" text,
	"object_identity" text,
	"actor_id" text,
	"ip_address" "inet",
	"user_agent" text,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault"."encryption_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"key_version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"algorithm" varchar(20) DEFAULT 'AES-256-GCM' NOT NULL,
	"key_fingerprint" varchar(64),
	"key_material" jsonb NOT NULL,
	CONSTRAINT "chk_key_material_s7" CHECK ((key_material IS NULL) OR ((jsonb_typeof(key_material) = 'object'::text) AND (key_material ? 'enc'::text) AND (key_material ? 'iv'::text) AND (key_material ? 'tag'::text) AND (key_material ? 'data'::text)))
);
--> statement-breakpoint
ALTER TABLE "vault"."encryption_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."system_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance"."tenant_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"subscription_amount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"platform_commission" numeric(12, 4) DEFAULT '0' NOT NULL,
	"app_charges" numeric(12, 4) DEFAULT '0' NOT NULL,
	"total" numeric(12, 4) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"pdf_url" text,
	CONSTRAINT "chk_invoice_math" CHECK (COALESCE(total, (0)::numeric) = ((COALESCE(subscription_amount, (0)::numeric) + COALESCE(platform_commission, (0)::numeric)) + COALESCE(app_charges, (0)::numeric))),
	CONSTRAINT "chk_invoice_period" CHECK (period_end >= period_start)
);
--> statement-breakpoint
ALTER TABLE "governance"."tenant_invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."tenant_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"max_products" integer,
	"max_orders" integer,
	"max_pages" integer,
	"max_staff" integer,
	"max_categories" integer,
	"max_coupons" integer,
	"storage_limit_gb" integer DEFAULT 1 NOT NULL,
	"api_rate_limit" integer
);
--> statement-breakpoint
ALTER TABLE "governance"."tenant_quotas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "governance"."plan_change_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_plan" varchar(50) NOT NULL,
	"to_plan" varchar(50) NOT NULL,
	"reason" text,
	"changed_by" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "governance"."plan_change_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "storefront"."entity_metafields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"namespace" varchar(100) DEFAULT 'global' NOT NULL,
	"key" varchar(100) NOT NULL,
	"type" varchar(20) DEFAULT 'string' NOT NULL,
	"value" jsonb NOT NULL,
	CONSTRAINT "uq_metafield" UNIQUE("entity_type","entity_id","namespace","key"),
	CONSTRAINT "chk_metafield_size" CHECK (pg_column_size(value) <= 10240)
);
--> statement-breakpoint
CREATE TABLE "storefront"."loyalty_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"points_per_currency" numeric(10, 4) DEFAULT '1' NOT NULL,
	"min_redeem_points" integer DEFAULT 100 NOT NULL,
	"points_expiry_days" integer,
	"rewards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_loyalty_math" CHECK ((points_per_currency > (0)::numeric) AND (min_redeem_points > 0)),
	CONSTRAINT "chk_points_expiry" CHECK ((points_expiry_days IS NULL) OR (points_expiry_days > 0))
);
--> statement-breakpoint
CREATE TABLE "storefront"."announcement_bars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"bg_color" varchar(20) DEFAULT '#000000' NOT NULL,
	"text_color" varchar(20) DEFAULT '#ffffff' NOT NULL,
	"content" jsonb NOT NULL,
	"link_url" text
);
--> statement-breakpoint
CREATE TABLE "storefront"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"date_of_birth" date,
	"wallet_balance" numeric(12, 4) DEFAULT '0' NOT NULL,
	"total_spent_amount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"total_orders_count" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"accepts_marketing" boolean DEFAULT false NOT NULL,
	"email" jsonb NOT NULL,
	"email_hash" char(64) NOT NULL,
	"password_hash" text,
	"first_name" jsonb,
	"last_name" jsonb,
	"phone" jsonb,
	"phone_hash" char(64),
	"avatar_url" text,
	"gender" varchar(10),
	"language" char(2) DEFAULT 'ar' NOT NULL,
	"notes" text,
	"tags" text,
	"version" integer DEFAULT 1 NOT NULL,
	"lock_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "chk_cust_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
	CONSTRAINT "chk_cust_firstname_s7" CHECK ((first_name IS NULL) OR ((jsonb_typeof(first_name) = 'object'::text) AND (first_name ? 'enc'::text) AND (first_name ? 'iv'::text) AND (first_name ? 'tag'::text) AND (first_name ? 'data'::text))),
	CONSTRAINT "chk_cust_lastname_s7" CHECK ((last_name IS NULL) OR ((jsonb_typeof(last_name) = 'object'::text) AND (last_name ? 'enc'::text) AND (last_name ? 'iv'::text) AND (last_name ? 'tag'::text) AND (last_name ? 'data'::text))),
	CONSTRAINT "chk_cust_phone_s7" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))),
	CONSTRAINT "chk_cust_pwd_hash" CHECK ((password_hash IS NULL) OR (password_hash ~ '^\$2[ayb]\$.+$'::text)),
	CONSTRAINT "chk_dob_past" CHECK ((date_of_birth IS NULL) OR (date_of_birth <= CURRENT_DATE)),
	CONSTRAINT "chk_total_spent_pos" CHECK ((COALESCE(total_spent_amount, (0)::numeric) >= (0)::numeric) AND (total_spent_amount IS NOT NULL)),
	CONSTRAINT "chk_wallet_bal_pos" CHECK ((COALESCE(wallet_balance, (0)::numeric) >= (0)::numeric) AND (wallet_balance IS NOT NULL) AND (wallet_balance IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "storefront"."customer_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_count" integer DEFAULT 0 NOT NULL,
	"auto_update" boolean DEFAULT true NOT NULL,
	"match_type" varchar(5) DEFAULT 'all' NOT NULL,
	"name" jsonb NOT NULL,
	"conditions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."tenant_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_config_key" CHECK ((key)::text ~ '^[a-zA-Z0-9_]+$'::text),
	CONSTRAINT "chk_tc_value_size" CHECK (pg_column_size(value) <= 102400)
);
--> statement-breakpoint
CREATE TABLE "storefront"."banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"location" varchar(50) DEFAULT 'home_top' NOT NULL,
	"image_url" text NOT NULL,
	"link_url" text,
	"title" jsonb,
	"content" jsonb
);
--> statement-breakpoint
CREATE TABLE "storefront"."shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"base_price" numeric(12, 4) NOT NULL,
	"free_shipping_threshold" numeric(12, 4),
	"min_delivery_days" integer,
	"max_delivery_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(100) NOT NULL,
	"region" varchar(100) NOT NULL,
	"country" char(2),
	"carrier" varchar(50),
	"estimated_days" varchar(50),
	CONSTRAINT "chk_delivery_logic" CHECK ((min_delivery_days >= 0) AND (min_delivery_days <= max_delivery_days))
);
--> statement-breakpoint
CREATE TABLE "storefront"."smart_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"slug" varchar(255) NOT NULL,
	"match_type" varchar(5) DEFAULT 'all' NOT NULL,
	"sort_by" varchar(50) DEFAULT 'best_selling' NOT NULL,
	"image_url" text,
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"title" jsonb NOT NULL,
	"conditions" jsonb NOT NULL,
	CONSTRAINT "idx_smart_collections_slug" UNIQUE("slug"),
	CONSTRAINT "chk_conditions_array" CHECK (jsonb_typeof(conditions) = 'array'::text),
	CONSTRAINT "conditions_size" CHECK (pg_column_size(conditions) <= 10240)
);
--> statement-breakpoint
CREATE TABLE "storefront"."wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" numeric(12, 4) NOT NULL,
	"balance_before" numeric(12, 4) NOT NULL,
	"balance_after" numeric(12, 4) NOT NULL,
	"type" varchar(20) NOT NULL,
	"reason" varchar(100) NOT NULL,
	"description" text,
	"idempotency_key" varchar(100),
	CONSTRAINT "chk_wallet_math" CHECK (COALESCE(balance_after, (0)::numeric) = (COALESCE(balance_before, (0)::numeric) + COALESCE(amount, (0)::numeric))),
	CONSTRAINT "wallet_non_negative_balance" CHECK (COALESCE(balance_after, (0)::numeric) >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "storefront"."search_synonyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" varchar(100) NOT NULL,
	"synonyms" jsonb NOT NULL,
	"language_code" char(2) DEFAULT 'ar' NOT NULL,
	"is_bidirectional" boolean DEFAULT true NOT NULL,
	CONSTRAINT "search_synonyms_term_unique" UNIQUE("term"),
	CONSTRAINT "chk_synonym_no_self_loop" CHECK (NOT (synonyms ? (term)::text))
);
--> statement-breakpoint
CREATE TABLE "governance"."subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"price_monthly" bigint NOT NULL,
	"price_yearly" bigint NOT NULL,
	"default_max_products" integer DEFAULT 50 NOT NULL,
	"default_max_orders" integer DEFAULT 100 NOT NULL,
	"default_max_pages" integer DEFAULT 5 NOT NULL,
	"default_max_staff" integer DEFAULT 3 NOT NULL,
	"default_max_storage_gb" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"description" text,
	"price_monthly_v2" numeric(12, 4) NOT NULL,
	"price_yearly_v2" numeric(12, 4) NOT NULL,
	CONSTRAINT "subscription_plans_code_unique" UNIQUE("code"),
	CONSTRAINT "chk_plan_price" CHECK ((COALESCE(price_monthly_v2, (0)::numeric) >= (0)::numeric) AND (COALESCE(price_yearly_v2, (0)::numeric) >= (0)::numeric))
);
--> statement-breakpoint
CREATE TABLE "storefront"."reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"sentiment_score" numeric(3, 2),
	"is_anomaly_flagged" boolean DEFAULT false NOT NULL,
	"embedding" vector(1536),
	"sentiment_confidence" numeric(3, 2),
	CONSTRAINT "chk_rating_bounds" CHECK ((rating >= 1) AND (rating <= 5)),
	CONSTRAINT "chk_sentiment_bounds" CHECK ((sentiment_score >= '-1.00'::numeric) AND (sentiment_score <= 1.00))
);
--> statement-breakpoint
CREATE TABLE "storefront"."product_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid,
	"session_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dwell_time_seconds" integer DEFAULT 0 NOT NULL,
	"source_medium" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "storefront"."popups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger_type" varchar(20) DEFAULT 'time_on_page' NOT NULL,
	"content" jsonb NOT NULL,
	"settings" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."currency_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_currency" char(3) NOT NULL,
	"to_currency" char(3) NOT NULL,
	"rate" numeric(12, 6) NOT NULL,
	CONSTRAINT "uq_tenant_currency_pair" UNIQUE("from_currency","to_currency")
);
--> statement-breakpoint
CREATE TABLE "storefront"."abandoned_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recovered_at" timestamp with time zone,
	"subtotal" numeric(12, 4),
	"recovery_email_sent" boolean DEFAULT false NOT NULL,
	"email" jsonb,
	"items" jsonb,
	"recovery_coupon_code" varchar(50),
	"recovered_amount" numeric(12, 4) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."affiliate_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"commission_rate" integer DEFAULT 500 NOT NULL,
	"total_earned" numeric(12, 4) DEFAULT '0' NOT NULL,
	"total_paid" numeric(12, 4) DEFAULT '0' NOT NULL,
	"status" "affiliate_status" DEFAULT 'pending' NOT NULL,
	"referral_code" varchar(50) NOT NULL,
	"email" jsonb NOT NULL,
	"email_hash" text,
	"payout_details" jsonb,
	CONSTRAINT "affiliate_partners_referral_code_unique" UNIQUE("referral_code"),
	CONSTRAINT "chk_aff_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
	CONSTRAINT "chk_aff_payout_s7" CHECK ((payout_details IS NULL) OR ((jsonb_typeof(payout_details) = 'object'::text) AND (payout_details ? 'enc'::text) AND (payout_details ? 'iv'::text) AND (payout_details ? 'tag'::text) AND (payout_details ? 'data'::text))),
	CONSTRAINT "chk_aff_rate_cap" CHECK ((commission_rate >= 0) AND (commission_rate <= 10000)),
	CONSTRAINT "chk_ref_code_upper" CHECK ((referral_code)::text = upper((referral_code)::text))
);
--> statement-breakpoint
CREATE TABLE "storefront"."affiliate_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"commission_amount" numeric(12, 4) NOT NULL,
	"hold_period_ends_at" timestamp with time zone,
	"status" "affiliate_tx_status" DEFAULT 'pending' NOT NULL,
	"payout_reference" varchar(100),
	CONSTRAINT "chk_aff_comm_positive" CHECK (COALESCE(commission_amount, (0)::numeric) > (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "storefront"."b2b_pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discount_basis_points" integer,
	"name" text NOT NULL,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"max_quantity" integer,
	"price" numeric(12, 4),
	"currency" char(3) DEFAULT 'SAR' NOT NULL,
	"quantity_range" "int4range" NOT NULL,
	"lock_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "chk_b2b_discount_max" CHECK ((discount_basis_points IS NULL) OR (discount_basis_points <= 10000)),
	CONSTRAINT "chk_b2b_price_pos" CHECK ((price IS NULL) OR ((price >= (0)::numeric) AND (price IS NOT NULL))),
	CONSTRAINT "chk_b2b_price_xor" CHECK ((price IS NULL) <> (discount_basis_points IS NULL))
);
--> statement-breakpoint
CREATE TABLE "storefront"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"products_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"slug" varchar(255) NOT NULL,
	"icon" varchar(100),
	"meta_title" varchar(150),
	"meta_description" varchar(255),
	"image_url" text,
	"banner_url" text,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"path" text,
	CONSTRAINT "chk_categories_no_circular_ref" CHECK ((parent_id IS NULL) OR (parent_id <> id))
);
--> statement-breakpoint
CREATE TABLE "storefront"."brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"slug" varchar(255) NOT NULL,
	"country" char(2),
	"website_url" text,
	"logo_url" text,
	"name" jsonb NOT NULL,
	"description" jsonb
);
--> statement-breakpoint
CREATE TABLE "storefront"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"base_price" numeric(12, 4) NOT NULL,
	"sale_price" numeric(12, 4),
	"cost_price" numeric(12, 4),
	"compare_at_price" numeric(12, 4),
	"tax_basis_points" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"weight" integer,
	"min_order_qty" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_returnable" boolean DEFAULT true NOT NULL,
	"requires_shipping" boolean DEFAULT true NOT NULL,
	"is_digital" boolean DEFAULT false NOT NULL,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"slug" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(50),
	"country_of_origin" varchar(100),
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"main_image" text NOT NULL,
	"video_url" text,
	"digital_file_url" text,
	"keywords" text,
	"avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"tags" text[],
	"name" jsonb NOT NULL,
	"short_description" jsonb,
	"long_description" jsonb,
	"specifications" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dimensions" jsonb,
	"gallery_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embedding" vector(1536),
	"version" bigint DEFAULT 1 NOT NULL,
	"warranty_period" integer,
	"warranty_unit" varchar(10),
	CONSTRAINT "chk_barcode_format" CHECK ((barcode IS NULL) OR ((barcode)::text ~ '^[A-Z0-9-]{8,50} $'::text)),
	CONSTRAINT "chk_compare_price" CHECK ((compare_at_price IS NULL) OR ((COALESCE(compare_at_price, (0)::numeric) > COALESCE(base_price, (0)::numeric)) AND (compare_at_price IS NOT NULL))),
	CONSTRAINT "chk_digital_shipping" CHECK (NOT (is_digital AND requires_shipping)),
	CONSTRAINT "chk_price_positive" CHECK ((COALESCE(base_price, (0)::numeric) >= (0)::numeric) AND (base_price IS NOT NULL) AND (base_price IS NOT NULL)),
	CONSTRAINT "chk_sale_price_math" CHECK ((sale_price IS NULL) OR ((COALESCE(sale_price, (0)::numeric) <= COALESCE(base_price, (0)::numeric)) AND (sale_price IS NOT NULL))),
	CONSTRAINT "chk_specs_size" CHECK (pg_column_size(specifications) <= 20480)
);
--> statement-breakpoint
CREATE TABLE "storefront"."b2b_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"credit_limit" numeric(12, 4) DEFAULT '0' NOT NULL,
	"credit_used" numeric(12, 4) DEFAULT '0' NOT NULL,
	"payment_terms_days" integer DEFAULT 30 NOT NULL,
	"status" "b2b_company_status" DEFAULT 'pending' NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id" varchar(50),
	"industry" varchar(100),
	"lock_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "chk_credit_limit_positive" CHECK (COALESCE(credit_limit, (0)::numeric) >= (0)::numeric),
	CONSTRAINT "chk_tax_id_len" CHECK ((tax_id IS NULL) OR (length((tax_id)::text) >= 5))
);
--> statement-breakpoint
CREATE TABLE "storefront"."b2b_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" "b2b_user_role" DEFAULT 'buyer' NOT NULL,
	"unit_price" numeric(12, 4) DEFAULT '0' NOT NULL,
	"currency" char(3) DEFAULT 'SAR' NOT NULL,
	CONSTRAINT "uq_b2b_company_customer" UNIQUE("company_id","customer_id"),
	CONSTRAINT "chk_b2b_unit_price_pos" CHECK (COALESCE(unit_price, (0)::numeric) >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "storefront"."blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"slug" varchar(100) NOT NULL,
	CONSTRAINT "uq_tenant_blog_cat_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "storefront"."blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"read_time_min" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"slug" varchar(255) NOT NULL,
	"category_id" uuid,
	"author_name" varchar(100),
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"featured_image" text,
	"tags" text[],
	"title" jsonb NOT NULL,
	"excerpt" jsonb,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"subtotal" numeric(12, 4),
	"session_id" varchar(64),
	"items" jsonb NOT NULL,
	"applied_coupons" jsonb,
	"lock_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "chk_cart_items_size" CHECK (pg_column_size(items) <= 51200),
	CONSTRAINT "chk_cart_subtotal_pos" CHECK ((subtotal IS NULL) OR (COALESCE(subtotal, (0)::numeric) >= (0)::numeric))
);
--> statement-breakpoint
CREATE TABLE "storefront"."cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(12, 4) NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_cart_item_price" CHECK (COALESCE(price, (0)::numeric) >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "storefront"."coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"value" numeric(12, 4) NOT NULL,
	"min_order_amount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_customer" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"lock_version" integer DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code"),
	CONSTRAINT "chk_coupon_min_amount" CHECK (COALESCE(min_order_amount, (0)::numeric) >= (0)::numeric),
	CONSTRAINT "chk_coupon_pct" CHECK (((type)::text <> 'percentage'::text) OR (COALESCE(value, (0)::numeric) <= (10000)::numeric)),
	CONSTRAINT "chk_coupon_val_positive" CHECK (COALESCE(value, (0)::numeric) > (0)::numeric),
	CONSTRAINT "coupon_code_upper_check" CHECK ((code)::text = upper((code)::text)),
	CONSTRAINT "coupon_usage_exhaustion_check" CHECK (used_count <= max_uses)
);
--> statement-breakpoint
CREATE TABLE "storefront"."coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_coupon_cust_order" UNIQUE("coupon_id","customer_id","order_id")
);
--> statement-breakpoint
CREATE TABLE "storefront"."customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_default_billing" boolean DEFAULT false NOT NULL,
	"label" varchar(50),
	"name" varchar(255) NOT NULL,
	"line1" jsonb NOT NULL,
	"line2" jsonb,
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"postal_code" jsonb NOT NULL,
	"country" char(2) NOT NULL,
	"phone" jsonb,
	"coordinates" text,
	CONSTRAINT "chk_addr_phone_encrypted" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))),
	CONSTRAINT "chk_city_not_empty" CHECK (length(TRIM(BOTH FROM city)) > 0),
	CONSTRAINT "chk_line1_encrypted" CHECK ((line1 IS NULL) OR ((jsonb_typeof(line1) = 'object'::text) AND (line1 ? 'enc'::text) AND (line1 ? 'iv'::text) AND (line1 ? 'tag'::text) AND (line1 ? 'data'::text))),
	CONSTRAINT "chk_postal_code_encrypted" CHECK ((postal_code IS NULL) OR ((jsonb_typeof(postal_code) = 'object'::text) AND (postal_code ? 'enc'::text) AND (postal_code ? 'iv'::text) AND (postal_code ? 'tag'::text) AND (postal_code ? 'data'::text)))
);
--> statement-breakpoint
CREATE TABLE "storefront"."customer_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"consented" boolean NOT NULL,
	"channel" "consent_channel" NOT NULL,
	"source" varchar(50),
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "storefront"."price_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"value" numeric(12, 4) NOT NULL,
	"min_purchase_amount" numeric(12, 4),
	"min_quantity" integer,
	"max_uses" integer,
	"max_uses_per_customer" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"type" "discount_type" NOT NULL,
	"applies_to" "discount_applies_to" DEFAULT 'all' NOT NULL,
	"title" jsonb NOT NULL,
	"entitled_ids" jsonb,
	"combines_with" jsonb,
	"lock_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "chk_entitled_array" CHECK ((entitled_ids IS NULL) OR (jsonb_typeof(entitled_ids) = 'array'::text)),
	CONSTRAINT "chk_entitled_len" CHECK ((entitled_ids IS NULL) OR (jsonb_array_length(entitled_ids) <= 5000)),
	CONSTRAINT "chk_pr_dates" CHECK ((ends_at IS NULL) OR (ends_at > starts_at))
);
--> statement-breakpoint
CREATE TABLE "storefront"."discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_rule_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"code" varchar(50) NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "chk_code_strict" CHECK (((code)::text = upper((code)::text)) AND ((code)::text ~ '^[A-Z0-9_-]+$'::text))
);
--> statement-breakpoint
CREATE TABLE "storefront"."faq_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"question" varchar(500) NOT NULL,
	"answer" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."flash_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	CONSTRAINT "chk_flash_time" CHECK (end_time > starts_at)
);
--> statement-breakpoint
CREATE TABLE "storefront"."flash_sale_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flash_sale_id" uuid,
	"product_id" uuid,
	"discount_basis_points" integer NOT NULL,
	"quantity_limit" integer NOT NULL,
	"sold_quantity" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"valid_during" "tstzrange",
	CONSTRAINT "chk_flash_limit" CHECK (sold_quantity <= quantity_limit)
);
--> statement-breakpoint
CREATE TABLE "storefront"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"market_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"subtotal" numeric(12, 4) NOT NULL,
	"discount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"shipping" numeric(12, 4) DEFAULT '0' NOT NULL,
	"tax" numeric(12, 4) DEFAULT '0' NOT NULL,
	"total" numeric(12, 4) NOT NULL,
	"coupon_discount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"refunded_amount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"risk_score" integer,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method",
	"source" "order_source" DEFAULT 'web' NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"coupon_code" varchar(50),
	"tracking_number" varchar(100),
	"guest_email" varchar(255),
	"cancel_reason" text,
	"ip_address" "inet",
	"user_agent" text,
	"tracking_url" text,
	"notes" text,
	"tags" text,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb NOT NULL,
	"version" bigint DEFAULT 1 NOT NULL,
	"lock_version" integer DEFAULT 1 NOT NULL,
	"idempotency_key" varchar(100),
	"device_fingerprint" varchar(64),
	"payment_gateway_reference" varchar(255),
	CONSTRAINT "chk_checkout_math" CHECK ((COALESCE(total, (0)::numeric) = ((((COALESCE(subtotal, (0)::numeric) + COALESCE(tax, (0)::numeric)) + COALESCE(shipping, (0)::numeric)) - COALESCE(discount, (0)::numeric)) - COALESCE(coupon_discount, (0)::numeric))) AND (COALESCE(total, (0)::numeric) >= (0)::numeric)),
	CONSTRAINT "chk_order_total_inner" CHECK ((total IS NOT NULL) AND (subtotal IS NOT NULL)),
	CONSTRAINT "chk_positive_costs" CHECK ((COALESCE(shipping, (0)::numeric) >= (0)::numeric) AND (COALESCE(tax, (0)::numeric) >= (0)::numeric)),
	CONSTRAINT "chk_refund_cap" CHECK (COALESCE(refunded_amount, (0)::numeric) <= COALESCE(total, (0)::numeric))
);
--> statement-breakpoint
CREATE TABLE "storefront"."fulfillments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"location_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"status" "fulfillment_status" DEFAULT 'pending' NOT NULL,
	"tracking_company" varchar(100),
	"tracking_details" jsonb
);
--> statement-breakpoint
CREATE TABLE "storefront"."product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"price" numeric(12, 4) NOT NULL,
	"compare_at_price" numeric(12, 4),
	"weight" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(50),
	"weight_unit" varchar(5) DEFAULT 'g' NOT NULL,
	"image_url" text,
	"options" jsonb NOT NULL,
	"embedding" vector(1536),
	CONSTRAINT "chk_variant_compare_price" CHECK ((compare_at_price IS NULL) OR (compare_at_price IS NOT NULL)),
	CONSTRAINT "chk_variant_options_obj" CHECK (jsonb_typeof(options) = 'object'::text),
	CONSTRAINT "chk_variant_price_pos" CHECK ((price >= (0)::numeric) AND (price IS NOT NULL) AND (price IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "storefront"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"price" numeric(12, 4) NOT NULL,
	"cost_price" numeric(12, 4),
	"total" numeric(12, 4) NOT NULL,
	"discount_amount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 4) DEFAULT '0' NOT NULL,
	"quantity" integer NOT NULL,
	"fulfilled_quantity" integer DEFAULT 0 NOT NULL,
	"returned_quantity" integer DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"image_url" text,
	"attributes" jsonb,
	"tax_lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discount_allocations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "chk_fulfill_qty" CHECK (fulfilled_quantity <= quantity),
	CONSTRAINT "chk_item_discount_logic" CHECK (COALESCE(discount_amount, (0)::numeric) <= (COALESCE(price, (0)::numeric) * (quantity)::numeric)),
	CONSTRAINT "chk_item_inner_not_null" CHECK ((price IS NOT NULL) AND (total IS NOT NULL)),
	CONSTRAINT "chk_item_math" CHECK (COALESCE(total, (0)::numeric) = (((COALESCE(price, (0)::numeric) * (quantity)::numeric) - COALESCE(discount_amount, (0)::numeric)) + COALESCE(tax_amount, (0)::numeric))),
	CONSTRAINT "chk_returned_qty" CHECK (returned_quantity <= fulfilled_quantity),
	CONSTRAINT "qty_positive" CHECK (quantity > 0)
);
--> statement-breakpoint
CREATE TABLE "storefront"."fulfillment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fulfillment_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"type" "location_type" DEFAULT 'warehouse' NOT NULL,
	"name" jsonb NOT NULL,
	"address" jsonb,
	"coordinates" text
);
--> statement-breakpoint
CREATE TABLE "storefront"."inventory_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"available" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"incoming" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "uq_inventory_loc_var" UNIQUE("location_id","variant_id"),
	CONSTRAINT "chk_available" CHECK (available >= 0),
	CONSTRAINT "chk_incoming_positive" CHECK (incoming >= 0),
	CONSTRAINT "chk_reserved" CHECK (reserved >= 0),
	CONSTRAINT "chk_reserved_logic" CHECK (reserved <= available)
);
--> statement-breakpoint
CREATE TABLE "storefront"."inventory_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_location_id" uuid NOT NULL,
	"to_location_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_arrival" timestamp with time zone,
	"status" "transfer_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "chk_transfer_future" CHECK ((expected_arrival IS NULL) OR (expected_arrival >= created_at)),
	CONSTRAINT "chk_transfer_locations" CHECK (from_location_id <> to_location_id)
);
--> statement-breakpoint
CREATE TABLE "storefront"."inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text,
	"reference_id" uuid,
	CONSTRAINT "chk_adj_reason" CHECK ((type <> 'adjustment'::inventory_movement_type) OR (reference_id IS NOT NULL)),
	CONSTRAINT "chk_movement_logic" CHECK (((type = 'in'::inventory_movement_type) AND (quantity > 0)) OR ((type = 'out'::inventory_movement_type) AND (quantity < 0)) OR (type = ANY (ARRAY['adjustment'::inventory_movement_type, 'transfer'::inventory_movement_type, 'return'::inventory_movement_type]))),
	CONSTRAINT "chk_return_positive" CHECK ((type <> 'return'::inventory_movement_type) OR (quantity > 0))
);
--> statement-breakpoint
CREATE TABLE "storefront"."inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"cart_id" uuid,
	"quantity" integer NOT NULL,
	CONSTRAINT "chk_res_qty_limit" CHECK (quantity <= 100),
	CONSTRAINT "chk_res_time_bound" CHECK (expires_at <= (created_at + '7 days'::interval))
);
--> statement-breakpoint
CREATE TABLE "storefront"."inventory_transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."kb_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"icon" varchar(50),
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "storefront"."kb_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "storefront"."order_edits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"line_item_id" uuid,
	"edited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount_change" numeric(12, 4) DEFAULT '0' NOT NULL,
	"edit_type" varchar(30) NOT NULL,
	"reason" text,
	"old_value" jsonb,
	"new_value" jsonb
);
--> statement-breakpoint
CREATE TABLE "storefront"."order_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) NOT NULL,
	"title" jsonb,
	"notes" text,
	"location" jsonb,
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "storefront"."product_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attribute_name" varchar(100) NOT NULL,
	"attribute_value" text NOT NULL,
	"attribute_group" varchar(100),
	CONSTRAINT "uq_tenant_product_attr" UNIQUE("product_id","attribute_name"),
	CONSTRAINT "chk_attr_val_len" CHECK (length(attribute_value) <= 1024)
);
--> statement-breakpoint
CREATE TABLE "storefront"."markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"default_currency" char(3) NOT NULL,
	"default_language" char(2) DEFAULT 'ar' NOT NULL,
	"name" jsonb NOT NULL,
	"countries" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"quantity_range" "int4range" NOT NULL,
	"price" numeric(12, 4) NOT NULL,
	"compare_at_price" numeric(12, 4),
	CONSTRAINT "chk_pl_inner_not_null" CHECK ((price IS NOT NULL) AND (price IS NOT NULL)),
	CONSTRAINT "chk_pl_price_inner" CHECK ((price IS NOT NULL) AND (price IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "storefront"."product_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"discount_value" numeric(12, 4) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"discount_type" varchar(20) DEFAULT 'percentage' NOT NULL,
	"name" jsonb NOT NULL,
	CONSTRAINT "chk_bundle_discount_positive" CHECK (COALESCE(discount_value, (0)::numeric) >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "storefront"."product_bundle_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "storefront"."rma_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason_code" "rma_reason_code" NOT NULL,
	"condition" "rma_condition" DEFAULT 'new' NOT NULL,
	"resolution" "rma_resolution" DEFAULT 'refund' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"description" text,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_arrival" timestamp with time zone,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(12, 4) NOT NULL,
	"tax" numeric(12, 4) DEFAULT '0' NOT NULL,
	"shipping_cost" numeric(12, 4) DEFAULT '0' NOT NULL,
	"total" numeric(12, 4) NOT NULL,
	"order_number" varchar(20),
	"notes" text,
	CONSTRAINT "idx_po_number_unique" UNIQUE("order_number"),
	CONSTRAINT "chk_po_inner_not_null" CHECK ((total IS NOT NULL) AND (subtotal IS NOT NULL)),
	CONSTRAINT "chk_po_math" CHECK (COALESCE(total, (0)::numeric) = ((COALESCE(subtotal, (0)::numeric) + COALESCE(tax, (0)::numeric)) + COALESCE(shipping_cost, (0)::numeric)))
);
--> statement-breakpoint
CREATE TABLE "storefront"."suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"lead_time_days" integer DEFAULT 7 NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"name" text NOT NULL,
	"email" jsonb,
	"phone" jsonb,
	"company" jsonb,
	"notes" text,
	"address" jsonb,
	CONSTRAINT "chk_sup_company_s7" CHECK ((company IS NULL) OR ((jsonb_typeof(company) = 'object'::text) AND (company ? 'enc'::text) AND (company ? 'iv'::text) AND (company ? 'tag'::text) AND (company ? 'data'::text))),
	CONSTRAINT "chk_sup_email_s7" CHECK ((email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))),
	CONSTRAINT "chk_sup_phone_s7" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text)))
);
--> statement-breakpoint
CREATE TABLE "storefront"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity_ordered" integer NOT NULL,
	"quantity_received" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(12, 4) NOT NULL,
	CONSTRAINT "chk_po_receive" CHECK (quantity_received <= quantity_ordered),
	CONSTRAINT "qty_positive" CHECK (quantity_ordered > 0)
);
--> statement-breakpoint
CREATE TABLE "storefront"."refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"refunded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" numeric(12, 4) NOT NULL,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"gateway_transaction_id" varchar(255),
	"reason" text,
	CONSTRAINT "chk_refund_positive" CHECK (COALESCE(amount, (0)::numeric) > (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "storefront"."refund_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refund_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"amount" numeric(12, 4) NOT NULL,
	CONSTRAINT "chk_refund_item_amt" CHECK ((COALESCE(amount, (0)::numeric) > (0)::numeric) AND (quantity > 0))
);
--> statement-breakpoint
CREATE TABLE "storefront"."rma_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rma_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"restocking_fee" numeric(12, 4) DEFAULT '0' NOT NULL,
	"reason_code" varchar(50) NOT NULL,
	"condition" varchar(20) NOT NULL,
	"resolution" varchar(20),
	CONSTRAINT "qty_positive" CHECK (quantity > 0)
);
--> statement-breakpoint
CREATE TABLE "storefront"."staff_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"permissions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront"."staff_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"deactivated_at" timestamp with time zone,
	"deactivated_by" uuid,
	"email" jsonb NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"phone" jsonb,
	"is_2fa_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" jsonb,
	CONSTRAINT "chk_staff_2fa_s7" CHECK ((two_factor_secret IS NULL) OR ((jsonb_typeof(two_factor_secret) = 'object'::text) AND (two_factor_secret ? 'enc'::text) AND (two_factor_secret ? 'iv'::text) AND (two_factor_secret ? 'tag'::text) AND (two_factor_secret ? 'data'::text))),
	CONSTRAINT "chk_staff_email_s7" CHECK ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text)),
	CONSTRAINT "chk_staff_phone_s7" CHECK ((phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text)))
);
--> statement-breakpoint
CREATE TABLE "governance"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"plan" "tenant_plan" DEFAULT 'free' NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"subdomain" text NOT NULL,
	"custom_domain" text,
	"name" text NOT NULL,
	"owner_email" jsonb,
	"owner_email_hash" text,
	"suspended_reason" text,
	"niche_type" text DEFAULT 'retail' NOT NULL,
	"niche_type_hash" text,
	"ui_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data_region" char(2) DEFAULT 'SA' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	CONSTRAINT "chk_owner_email_s7" CHECK ((owner_email IS NULL) OR ((jsonb_typeof(owner_email) = 'object'::text) AND (owner_email ? 'enc'::text) AND (owner_email ? 'iv'::text) AND (owner_email ? 'tag'::text) AND (owner_email ? 'data'::text))),
	CONSTRAINT "chk_ui_config_size" CHECK (pg_column_size(ui_config) <= 204800)
);
--> statement-breakpoint
ALTER TABLE "governance"."tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "storefront"."staff_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"token_hash" char(64) NOT NULL,
	"device_fingerprint" varchar(64),
	"ip_address" "inet",
	"asn" varchar(50),
	"ip_country" char(2),
	"user_agent" text,
	"session_salt_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "staff_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "storefront"."tax_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "storefront"."tax_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_category_id" uuid,
	"rate" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_inclusive" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(100) NOT NULL,
	"country" char(2) NOT NULL,
	"state" varchar(100),
	"zip_code" varchar(20),
	"applies_to" varchar(20) DEFAULT 'all' NOT NULL,
	"tax_type" varchar(50) DEFAULT 'VAT' NOT NULL,
	"rounding_rule" varchar(20) DEFAULT 'half_even' NOT NULL,
	CONSTRAINT "uq_tax_rule" UNIQUE("country","state","zip_code","tax_type"),
	CONSTRAINT "chk_tax_rate_bounds" CHECK ((rate >= 0) AND (rate <= 10000)),
	CONSTRAINT "chk_tax_rounding" CHECK ((rounding_rule)::text = ANY (ARRAY[('half_even'::character varying)::text, ('half_up'::character varying)::text, ('half_down'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "vault"."archival_vault" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" text NOT NULL,
	"original_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text NOT NULL,
	"payload" jsonb NOT NULL,
	"tombstone_hash" text NOT NULL,
	CONSTRAINT "chk_payload_size" CHECK (pg_column_size(payload) <= 102400)
);
--> statement-breakpoint
ALTER TABLE "vault"."archival_vault" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "storefront"."app_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"app_name" varchar(255) NOT NULL,
	"api_key" jsonb,
	"access_token" jsonb,
	"api_secret_hash" char(64),
	"webhook_url" text,
	"scopes" jsonb,
	"key_rotated_at" timestamp with time zone,
	CONSTRAINT "chk_app_key_s7" CHECK ((api_key IS NULL) OR ((jsonb_typeof(api_key) = 'object'::text) AND (api_key ? 'enc'::text) AND (api_key ? 'iv'::text) AND (api_key ? 'tag'::text) AND (api_key ? 'data'::text))),
	CONSTRAINT "chk_app_token_s7" CHECK ((access_token IS NULL) OR ((jsonb_typeof(access_token) = 'object'::text) AND (access_token ? 'enc'::text) AND (access_token ? 'iv'::text) AND (access_token ? 'tag'::text) AND (access_token ? 'data'::text))),
	CONSTRAINT "chk_scopes_structure" CHECK ((scopes IS NULL) OR (jsonb_typeof(scopes) = 'array'::text))
);
--> statement-breakpoint
CREATE TABLE "storefront"."webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"event" varchar(100) NOT NULL,
	"target_url" text NOT NULL,
	"secret" jsonb,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"suspended_at" timestamp with time zone,
	CONSTRAINT "chk_https_only" CHECK (target_url ~ '^https://'::text),
	CONSTRAINT "chk_retry_limit" CHECK (retry_count <= max_retries),
	CONSTRAINT "chk_ssrf_protection" CHECK (target_url ~ '^https://(?!localhost|127\\.|10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[0-1]))'::text),
	CONSTRAINT "chk_url_length" CHECK (length(target_url) <= 2048),
	CONSTRAINT "chk_webhook_secret_s7" CHECK ((secret IS NULL) OR ((jsonb_typeof(secret) = 'object'::text) AND (secret ? 'enc'::text) AND (secret ? 'iv'::text) AND (secret ? 'tag'::text) AND (secret ? 'data'::text))),
	CONSTRAINT "chk_webhook_url_limit" CHECK (length(target_url) <= 2048),
	CONSTRAINT "webhook_secret_min_length" CHECK ((secret IS NULL) OR (octet_length((secret ->> 'enc'::text)) >= 32))
);
--> statement-breakpoint
ALTER TABLE "storefront"."abandoned_checkouts" ADD CONSTRAINT "fk_ac_customer" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."affiliate_transactions" ADD CONSTRAINT "fk_afftx_partner" FOREIGN KEY ("partner_id") REFERENCES "storefront"."affiliate_partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."b2b_pricing_tiers" ADD CONSTRAINT "fk_b2bpt_company" FOREIGN KEY ("company_id") REFERENCES "storefront"."b2b_companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."b2b_pricing_tiers" ADD CONSTRAINT "fk_b2bpt_product" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."categories" ADD CONSTRAINT "fk_cat_parent" FOREIGN KEY ("parent_id") REFERENCES "storefront"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."products" ADD CONSTRAINT "fk_prod_brand" FOREIGN KEY ("brand_id") REFERENCES "storefront"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."products" ADD CONSTRAINT "fk_prod_cat" FOREIGN KEY ("category_id") REFERENCES "storefront"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."b2b_users" ADD CONSTRAINT "fk_b2bu_company" FOREIGN KEY ("company_id") REFERENCES "storefront"."b2b_companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."blog_posts" ADD CONSTRAINT "fk_bp_category" FOREIGN KEY ("category_id") REFERENCES "storefront"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."carts" ADD CONSTRAINT "fk_cart_customer" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."cart_items" ADD CONSTRAINT "fk_ci_cart" FOREIGN KEY ("cart_id") REFERENCES "storefront"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."coupon_usages" ADD CONSTRAINT "fk_cu_coupon" FOREIGN KEY ("coupon_id") REFERENCES "storefront"."coupons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."customer_addresses" ADD CONSTRAINT "fk_addr_cust" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."customer_consents" ADD CONSTRAINT "fk_consent_cust" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."discount_codes" ADD CONSTRAINT "fk_dc_price_rule" FOREIGN KEY ("price_rule_id") REFERENCES "storefront"."price_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."faqs" ADD CONSTRAINT "fk_faq_category" FOREIGN KEY ("category_id") REFERENCES "storefront"."faq_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."flash_sale_products" ADD CONSTRAINT "fk_fsp_flash_sale" FOREIGN KEY ("flash_sale_id") REFERENCES "storefront"."flash_sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD CONSTRAINT "fk_ord_customer" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."fulfillments" ADD CONSTRAINT "fk_ful_order" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."product_variants" ADD CONSTRAINT "fk_var_prod" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."order_items" ADD CONSTRAINT "fk_oi_order" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."order_items" ADD CONSTRAINT "fk_oi_variant" FOREIGN KEY ("variant_id") REFERENCES "storefront"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."fulfillment_items" ADD CONSTRAINT "fk_fi_fulfillment" FOREIGN KEY ("fulfillment_id") REFERENCES "storefront"."fulfillments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."fulfillment_items" ADD CONSTRAINT "fk_fi_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_levels" ADD CONSTRAINT "fk_inv_loc" FOREIGN KEY ("location_id") REFERENCES "storefront"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_levels" ADD CONSTRAINT "fk_inv_variant" FOREIGN KEY ("variant_id") REFERENCES "storefront"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_transfers" ADD CONSTRAINT "fk_it_from_loc" FOREIGN KEY ("from_location_id") REFERENCES "storefront"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_transfers" ADD CONSTRAINT "fk_it_to_loc" FOREIGN KEY ("to_location_id") REFERENCES "storefront"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_movements" ADD CONSTRAINT "fk_im_loc" FOREIGN KEY ("location_id") REFERENCES "storefront"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_movements" ADD CONSTRAINT "fk_im_variant" FOREIGN KEY ("variant_id") REFERENCES "storefront"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_reservations" ADD CONSTRAINT "fk_ir_loc" FOREIGN KEY ("location_id") REFERENCES "storefront"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_reservations" ADD CONSTRAINT "fk_ir_variant" FOREIGN KEY ("variant_id") REFERENCES "storefront"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_transfer_items" ADD CONSTRAINT "fk_iti_transfer" FOREIGN KEY ("transfer_id") REFERENCES "storefront"."inventory_transfers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."inventory_transfer_items" ADD CONSTRAINT "fk_iti_variant" FOREIGN KEY ("variant_id") REFERENCES "storefront"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."kb_articles" ADD CONSTRAINT "fk_kba_category" FOREIGN KEY ("category_id") REFERENCES "storefront"."kb_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."order_edits" ADD CONSTRAINT "fk_oe_line_item" FOREIGN KEY ("line_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."order_edits" ADD CONSTRAINT "fk_oe_order" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."order_timeline" ADD CONSTRAINT "fk_ot_order" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."product_attributes" ADD CONSTRAINT "fk_attr_prod" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."price_lists" ADD CONSTRAINT "fk_pl_market" FOREIGN KEY ("market_id") REFERENCES "storefront"."markets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."product_bundle_items" ADD CONSTRAINT "fk_pbi_bundle" FOREIGN KEY ("bundle_id") REFERENCES "storefront"."product_bundles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."product_images" ADD CONSTRAINT "fk_img_prod" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."rma_requests" ADD CONSTRAINT "fk_rma_order" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."rma_requests" ADD CONSTRAINT "fk_rma_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."purchase_orders" ADD CONSTRAINT "fk_po_location" FOREIGN KEY ("location_id") REFERENCES "storefront"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."purchase_orders" ADD CONSTRAINT "fk_po_supplier" FOREIGN KEY ("supplier_id") REFERENCES "storefront"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."purchase_order_items" ADD CONSTRAINT "fk_poi_po" FOREIGN KEY ("po_id") REFERENCES "storefront"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."purchase_order_items" ADD CONSTRAINT "fk_poi_variant" FOREIGN KEY ("variant_id") REFERENCES "storefront"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."refunds" ADD CONSTRAINT "fk_ref_order" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."refund_items" ADD CONSTRAINT "fk_ri_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."refund_items" ADD CONSTRAINT "fk_ri_refund" FOREIGN KEY ("refund_id") REFERENCES "storefront"."refunds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."rma_items" ADD CONSTRAINT "fk_rmai_order_item" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."rma_items" ADD CONSTRAINT "fk_rmai_rma" FOREIGN KEY ("rma_id") REFERENCES "storefront"."rma_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."staff_members" ADD CONSTRAINT "fk_sm_role" FOREIGN KEY ("role_id") REFERENCES "storefront"."staff_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."staff_sessions" ADD CONSTRAINT "fk_ss_staff" FOREIGN KEY ("staff_id") REFERENCES "storefront"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."tax_rules" ADD CONSTRAINT "fk_tr_tax_category" FOREIGN KEY ("tax_category_id") REFERENCES "storefront"."tax_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront"."webhook_subscriptions" ADD CONSTRAINT "fk_ws_app" FOREIGN KEY ("app_id") REFERENCES "storefront"."app_installations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pages_published" ON "storefront"."pages" USING btree ("is_published" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pages_slug_active" ON "storefront"."pages" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_legal_published" ON "storefront"."legal_pages" USING btree ("is_published" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_dunning_events_tenant" ON "governance"."dunning_events" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_feature_gates_tenant" ON "governance"."feature_gates" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_feature_key" ON "governance"."feature_gates" USING btree ("feature_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_feature_tenant" ON "governance"."feature_gates" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_converted" ON "governance"."leads" USING btree ("converted_tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_email_hash" ON "governance"."leads" USING btree ("email_hash" text_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "governance"."leads" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_leads_tenant" ON "governance"."leads" USING btree ("converted_tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_app_usage_records_tenant" ON "governance"."app_usage_records" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_mkt_published" ON "governance"."marketing_pages" USING btree ("is_published" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_mkt_slug" ON "governance"."marketing_pages" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_mkt_type" ON "governance"."marketing_pages" USING btree ("page_type" text_ops);--> statement-breakpoint
CREATE INDEX "blueprint_niche_plan_idx" ON "governance"."onboarding_blueprints" USING btree ("niche_type" enum_ops,"plan" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_fraud_flagged" ON "governance"."order_fraud_scores" USING btree ("is_flagged" bool_ops) WHERE ((is_flagged = true) AND (is_reviewed = false));--> statement-breakpoint
CREATE INDEX "idx_fraud_order" ON "governance"."order_fraud_scores" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_fraud_tenant" ON "governance"."order_fraud_scores" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_order_fraud_scores_tenant" ON "governance"."order_fraud_scores" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_drift_time" ON "governance"."schema_drift_log" USING brin ("executed_at" timestamptz_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_encryption_keys_tenant" ON "vault"."encryption_keys" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "governance"."tenant_invoices" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_tenant" ON "governance"."tenant_invoices" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tenant_invoices_tenant" ON "governance"."tenant_invoices" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tenant_quotas_tenant" ON "governance"."tenant_quotas" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_plan_change_history_tenant" ON "governance"."plan_change_history" USING btree ("tenant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_metafields_lookup" ON "storefront"."entity_metafields" USING btree ("entity_type" text_ops,"entity_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customer_email_hash" ON "storefront"."customers" USING btree ("email_hash" bpchar_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customer_phone_hash" ON "storefront"."customers" USING btree ("phone_hash" bpchar_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_customers_active" ON "storefront"."customers" USING btree ("created_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_customers_dob" ON "storefront"."customers" USING btree ("date_of_birth" date_ops);--> statement-breakpoint
CREATE INDEX "idx_customers_tags" ON "storefront"."customers" USING btree ("tags" text_ops);--> statement-breakpoint
CREATE INDEX "idx_banners_active" ON "storefront"."banners" USING btree ("is_active" text_ops,"location" text_ops);--> statement-breakpoint
CREATE INDEX "idx_shipping_active" ON "storefront"."shipping_zones" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_shipping_region" ON "storefront"."shipping_zones" USING btree ("region" text_ops);--> statement-breakpoint
CREATE INDEX "idx_wallet_created" ON "storefront"."wallet_transactions" USING brin ("created_at" timestamptz_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_wallet_customer" ON "storefront"."wallet_transactions" USING btree ("customer_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_tx_idempotency" ON "storefront"."wallet_transactions" USING btree ("idempotency_key" text_ops) WHERE (idempotency_key IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_reviews_embedding_cosine" ON "storefront"."reviews" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_pv_product" ON "storefront"."product_views" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_abandoned_created" ON "storefront"."abandoned_checkouts" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_affiliate_email_hash" ON "storefront"."affiliate_partners" USING btree ("email_hash" text_ops);--> statement-breakpoint
CREATE INDEX "idx_aff_trans_created_brin" ON "storefront"."affiliate_transactions" USING brin ("created_at" timestamptz_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_aff_trans_order" ON "storefront"."affiliate_transactions" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_aff_trans_partner" ON "storefront"."affiliate_transactions" USING btree ("partner_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_b2b_pricing" ON "storefront"."b2b_pricing_tiers" USING btree ("company_id" uuid_ops,"product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_b2b_pricing_overlap" ON "storefront"."b2b_pricing_tiers" USING gist ("company_id" range_ops,"product_id" range_ops,"quantity_range" range_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_active" ON "storefront"."categories" USING btree ("is_active" bool_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_categories_parent" ON "storefront"."categories" USING btree ("parent_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_categories_slug_active" ON "storefront"."categories" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_brands_active" ON "storefront"."brands" USING btree ("is_active" bool_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_brands_slug_active" ON "storefront"."brands" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_products_active" ON "storefront"."products" USING btree ("category_id" uuid_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_products_brand" ON "storefront"."products" USING btree ("brand_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_products_embedding_cosine" ON "storefront"."products" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_products_featured" ON "storefront"."products" USING btree ("is_featured" bool_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_products_name" ON "storefront"."products" USING gin ("name" jsonb_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_products_sku_active" ON "storefront"."products" USING btree ("sku" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_products_slug_active" ON "storefront"."products" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_products_tags" ON "storefront"."products" USING gin ("tags" array_ops);--> statement-breakpoint
CREATE INDEX "idx_b2b_user" ON "storefront"."b2b_users" USING btree ("company_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_published" ON "storefront"."blog_posts" USING btree ("is_published" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_blog_published_at" ON "storefront"."blog_posts" USING btree ("published_at" timestamptz_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_blog_slug_active" ON "storefront"."blog_posts" USING btree ("slug" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_blog_tags" ON "storefront"."blog_posts" USING gin ("tags" array_ops);--> statement-breakpoint
CREATE INDEX "idx_carts_customer" ON "storefront"."carts" USING btree ("customer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_carts_expires" ON "storefront"."carts" USING btree ("expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_carts_session" ON "storefront"."carts" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_cart_items_cart" ON "storefront"."cart_items" USING btree ("cart_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_coupons_active" ON "storefront"."coupons" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_coupons_code" ON "storefront"."coupons" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_lookup" ON "storefront"."coupon_usages" USING btree ("coupon_id" uuid_ops,"customer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_customer_addresses_customer" ON "storefront"."customer_addresses" USING btree ("customer_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cust_default_addr" ON "storefront"."customer_addresses" USING btree ("customer_id" uuid_ops) WHERE (is_default = true);--> statement-breakpoint
CREATE INDEX "idx_consent_customer" ON "storefront"."customer_consents" USING btree ("customer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_price_rules_active" ON "storefront"."price_rules" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_discount_code" ON "storefront"."discount_codes" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_faq_active" ON "storefront"."faqs" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_faq_category" ON "storefront"."faqs" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_flash_sales_end_time" ON "storefront"."flash_sales" USING btree ("end_time" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_flash_sales_status" ON "storefront"."flash_sales" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_flash_sale_product_overlap" ON "storefront"."flash_sale_products" USING gist ("product_id" range_ops,"valid_during" gist_uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_fs_prod_campaign" ON "storefront"."flash_sale_products" USING btree ("flash_sale_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_fs_prod_product" ON "storefront"."flash_sale_products" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_orders_admin" ON "storefront"."orders" USING btree ("status" timestamptz_ops,"created_at" timestamptz_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_orders_created" ON "storefront"."orders" USING brin ("created_at" timestamptz_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "storefront"."orders" USING btree ("customer_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_idempotency" ON "storefront"."orders" USING btree ("idempotency_key" text_ops) WHERE (idempotency_key IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_number_active" ON "storefront"."orders" USING btree ("order_number" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_orders_payment_ref" ON "storefront"."orders" USING btree ("payment_gateway_reference" text_ops) WHERE (payment_gateway_reference IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_fulfillments_order" ON "storefront"."fulfillments" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_variant_sku_active" ON "storefront"."product_variants" USING btree ("sku" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_variants_product" ON "storefront"."product_variants" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_oi_product" ON "storefront"."order_items" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "storefront"."order_items" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_fulfill_items" ON "storefront"."fulfillment_items" USING btree ("fulfillment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_inv_variant" ON "storefront"."inventory_levels" USING btree ("variant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_inv_mov_created" ON "storefront"."inventory_movements" USING brin ("created_at" timestamptz_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_inv_mov_variant" ON "storefront"."inventory_movements" USING btree ("variant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_inv_res_active" ON "storefront"."inventory_reservations" USING btree ("status" enum_ops) WHERE (status = 'active'::reservation_status);--> statement-breakpoint
CREATE INDEX "idx_inv_res_cron" ON "storefront"."inventory_reservations" USING btree ("expires_at" timestamptz_ops) WHERE (status = 'active'::reservation_status);--> statement-breakpoint
CREATE INDEX "idx_transfer_items" ON "storefront"."inventory_transfer_items" USING btree ("transfer_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_kb_article_slug" ON "storefront"."kb_articles" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_order_edits" ON "storefront"."order_edits" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_timeline_created" ON "storefront"."order_timeline" USING brin ("created_at" timestamptz_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_timeline_order" ON "storefront"."order_timeline" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attrs_product" ON "storefront"."product_attributes" USING btree ("product_id" text_ops,"attribute_name" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tenant_primary_market" ON "storefront"."markets" USING btree ("id" uuid_ops) WHERE (is_primary = true);--> statement-breakpoint
CREATE INDEX "idx_price_list_overlap" ON "storefront"."price_lists" USING gist ("product_id" range_ops,"variant_id" range_ops,"market_id" gist_uuid_ops,"quantity_range" gist_uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_bundle_items" ON "storefront"."product_bundle_items" USING btree ("bundle_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_product_images_product" ON "storefront"."product_images" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_primary_image" ON "storefront"."product_images" USING btree ("product_id" uuid_ops) WHERE (is_primary = true);--> statement-breakpoint
CREATE INDEX "idx_rma_order" ON "storefront"."rma_requests" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_rma_status" ON "storefront"."rma_requests" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_po_status" ON "storefront"."purchase_orders" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_po_supplier" ON "storefront"."purchase_orders" USING btree ("supplier_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_po_items" ON "storefront"."purchase_order_items" USING btree ("po_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_refunds_order" ON "storefront"."refunds" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_refund_items" ON "storefront"."refund_items" USING btree ("refund_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_rma_items_rma" ON "storefront"."rma_items" USING btree ("rma_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_staff_active" ON "storefront"."staff_members" USING btree ("is_active" bool_ops) WHERE (is_active = true);--> statement-breakpoint
CREATE INDEX "idx_staff_user" ON "storefront"."staff_members" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tenants_email_hash" ON "governance"."tenants" USING btree ("owner_email_hash" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_custom_domain_unique" ON "governance"."tenants" USING btree ("custom_domain" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_subdomain_unique" ON "governance"."tenants" USING btree ("subdomain" text_ops) WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_session_active" ON "storefront"."staff_sessions" USING btree ("staff_id" uuid_ops) WHERE (revoked_at IS NULL);--> statement-breakpoint
CREATE INDEX "idx_session_revocation_lookup" ON "storefront"."staff_sessions" USING btree ("staff_id" text_ops,"device_fingerprint" text_ops,"revoked_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tax_rules_country" ON "storefront"."tax_rules" USING btree ("country" bpchar_ops);--> statement-breakpoint
CREATE INDEX "idx_webhook_app" ON "storefront"."webhook_subscriptions" USING btree ("app_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_webhook_event" ON "storefront"."webhook_subscriptions" USING btree ("event" text_ops);--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."dunning_events" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."feature_gates" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."leads" AS PERMISSIVE FOR ALL TO public USING ((converted_tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."app_usage_records" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."order_fraud_scores" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "vault"."encryption_keys" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."tenant_invoices" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."tenant_quotas" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."plan_change_history" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "governance"."tenants" AS PERMISSIVE FOR ALL TO public USING ((id = (current_setting('app.current_tenant_id'::text))::uuid));--> statement-breakpoint
CREATE POLICY "tenant_isolation_policy" ON "vault"."archival_vault" AS PERMISSIVE FOR ALL TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));
*/