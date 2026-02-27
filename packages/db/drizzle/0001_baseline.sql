-- 🚨 PRE-FLIGHT DEPENDENCY CHECK
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_partman') THEN
        RAISE EXCEPTION 'CRITICAL: pg_partman extension is not available on this server. Please install it before migrating.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') THEN
        RAISE EXCEPTION 'CRITICAL: postgis extension is not available on this server. Please install it before migrating.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
        RAISE EXCEPTION 'CRITICAL: vector extension is not available on this server. Please install it before migrating.';
    END IF;
END $$;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "governance";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "vault";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "storefront";
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_amount') THEN CREATE TYPE "public"."money_amount" AS (amount BIGINT, currency CHAR(3)); END IF; END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.gen_ulid() RETURNS uuid AS $$
DECLARE
  t_ms BIGINT;
  r1 BIGINT;
  r2 BIGINT;
  res TEXT;
BEGIN
  t_ms := (EXTRACT(EPOCH FROM CLOCK_TIMESTAMP()) * 1000)::BIGINT;
  r1 := (random() * 4294967295)::BIGINT;
  r2 := (random() * 4294967295)::BIGINT;
  res := lpad(to_hex(t_ms), 12, '0') || lpad(to_hex(r1), 8, '0') || lpad(to_hex(r2), 12, '0');
  RETURN res::uuid;
END;
$$ LANGUAGE plpgsql STABLE;
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'affiliate_status') THEN CREATE TYPE "public"."affiliate_status" AS ENUM('active', 'pending', 'suspended'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'affiliate_tx_status') THEN CREATE TYPE "public"."affiliate_tx_status" AS ENUM('pending', 'approved', 'paid', 'rejected'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_result') THEN CREATE TYPE "public"."audit_result" AS ENUM('SUCCESS', 'FAILURE'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_company_status') THEN CREATE TYPE "public"."b2b_company_status" AS ENUM('active', 'pending', 'suspended'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_user_role') THEN CREATE TYPE "public"."b2b_user_role" AS ENUM('admin', 'buyer', 'viewer'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blueprint_status') THEN CREATE TYPE "public"."blueprint_status" AS ENUM('active', 'paused'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consent_channel') THEN CREATE TYPE "public"."consent_channel" AS ENUM('email', 'sms', 'push', 'whatsapp'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_applies_to') THEN CREATE TYPE "public"."discount_applies_to" AS ENUM('all', 'specific_products', 'specific_categories', 'specific_customers'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed', 'buy_x_get_y', 'free_shipping'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dunning_status') THEN CREATE TYPE "public"."dunning_status" AS ENUM('pending', 'retried', 'failed', 'recovered'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fulfillment_status') THEN CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'shipped', 'in_transit', 'delivered', 'failed'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_movement_type') THEN CREATE TYPE "public"."inventory_movement_type" AS ENUM('in', 'out', 'adjustment', 'return', 'transfer'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'overdue'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'converted'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN CREATE TYPE "public"."location_type" AS ENUM('warehouse', 'retail', 'dropship'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_source') THEN CREATE TYPE "public"."order_source" AS ENUM('web', 'mobile', 'b2b', 'pos'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outbox_status') THEN CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'completed', 'failed'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN CREATE TYPE "public"."payment_method" AS ENUM('card', 'cod', 'wallet', 'bnpl', 'bank_transfer'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partially_refunded', 'refunded', 'failed'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'ordered', 'partial', 'received', 'cancelled'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processed', 'failed'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN CREATE TYPE "public"."reservation_status" AS ENUM('active', 'converted', 'expired'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_condition') THEN CREATE TYPE "public"."rma_condition" AS ENUM('new', 'opened', 'damaged'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_reason_code') THEN CREATE TYPE "public"."rma_reason_code" AS ENUM('defective', 'wrong_item', 'changed_mind', 'not_as_described', 'damaged_in_transit'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rma_resolution') THEN CREATE TYPE "public"."rma_resolution" AS ENUM('refund', 'exchange', 'store_credit'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_severity') THEN CREATE TYPE "public"."audit_severity" AS ENUM('INFO', 'WARNING', 'CRITICAL'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_niche') THEN CREATE TYPE "public"."tenant_niche" AS ENUM('retail', 'wellness', 'education', 'services', 'hospitality', 'real-estate', 'creative'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_plan') THEN CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'basic', 'pro', 'enterprise'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'pending', 'archived'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status') THEN CREATE TYPE "public"."transfer_status" AS ENUM('draft', 'in_transit', 'received', 'cancelled'); END IF; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."audit_logs" (
	"id" uuid DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"severity" "audit_severity" DEFAULT 'INFO' NOT NULL,
	"result" "audit_result" DEFAULT 'SUCCESS' NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"impersonator_id" text,
	"checksum" text,
	PRIMARY KEY (id)
);
--> statement-breakpoint
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."app_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"app_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" bigint NOT NULL,
	"metric" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."dunning_events" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"next_retry_at" timestamp with time zone,
	"status" "dunning_status" DEFAULT 'pending' NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"amount" bigint NOT NULL,
	"payment_method" text,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vault"."encryption_keys" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"rotated_at" timestamp with time zone,
	"key_version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true,
	"algorithm" varchar(20) DEFAULT 'AES-256-GCM' NOT NULL,
	"encrypted_key" bytea NOT NULL,
	CONSTRAINT "encryption_keys_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."feature_gates" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_enabled" boolean DEFAULT false,
	"plan_code" varchar(50),
	"feature_key" varchar(100) NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."leads" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"converted_tenant_id" uuid,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"email" text NOT NULL,
	"email_hash" char(64) NOT NULL,
	"name" text,
	"source" varchar(50),
	"landing_page_url" text,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."plan_change_history" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"from_plan" varchar(50) NOT NULL,
	"to_plan" varchar(50) NOT NULL,
	"reason" text,
	"changed_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"price_monthly" "public"."money_amount" NOT NULL,
	"price_yearly" "public"."money_amount" NOT NULL,
	"default_max_products" integer DEFAULT 50,
	"default_max_orders" integer DEFAULT 100,
	"default_max_pages" integer DEFAULT 5,
	"default_max_staff" integer DEFAULT 3,
	"default_max_storage_gb" integer DEFAULT 1,
	"default_max_variants_per_product" integer DEFAULT 50,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"description" text,
	CONSTRAINT "subscription_plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."system_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."tenant_invoices" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"paid_at" timestamp with time zone,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"subscription_amount" bigint DEFAULT 0,
	"platform_commission" bigint DEFAULT 0,
	"app_charges" bigint DEFAULT 0,
	"total" bigint NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"pdf_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."tenant_quotas" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"max_products" integer,
	"max_orders" integer,
	"max_pages" integer,
	"max_staff" integer,
	"max_categories" integer,
	"max_coupons" integer,
	"storage_limit_gb" integer DEFAULT 1,
	"api_rate_limit" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."onboarding_blueprints" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"plan" "tenant_plan" DEFAULT 'free' NOT NULL,
	"niche_type" "tenant_niche" DEFAULT 'retail' NOT NULL,
	"status" "blueprint_status" DEFAULT 'active' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"blueprint" jsonb NOT NULL,
	"ui_config" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."tenant_migrations" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"migration_name" text NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"trial_ends_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"plan" "tenant_plan" DEFAULT 'free' NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"subdomain" text NOT NULL,
	"custom_domain" text,
	"name" text NOT NULL,
	"owner_email" text,
	"owner_email_hash" text,
	"suspended_reason" text,
	"niche_type" text DEFAULT 'retail' NOT NULL,
	"niche_type_hash" text,
	"ui_config" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "tenants_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
ALTER TABLE "governance"."tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."stores" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"name" text NOT NULL,
	"subdomain" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."users" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"email" text NOT NULL,
	"email_hash" text NOT NULL,
	"password" text,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_hash_unique" UNIQUE("email_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."auth_logs" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid,
	"action" varchar(50) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid,
	"phone" varchar(20),
	"code" varchar(10) NOT NULL,
	"purpose" varchar(20) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."brands" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"slug" varchar(255) NOT NULL,
	"country" varchar(100),
	"website_url" text,
	"logo_url" text,
	"name" jsonb NOT NULL,
	"description" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."carts" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"subtotal" bigint,
	"session_id" varchar(64),
	"items" jsonb NOT NULL,
	"applied_coupons" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."categories" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0,
	"products_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"slug" varchar(255) NOT NULL,
	"icon" varchar(100),
	"meta_title" varchar(150),
	"meta_description" varchar(255),
	"image_url" text,
	"banner_url" text,
	"name" jsonb NOT NULL,
	"description" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."entity_metafields" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"namespace" varchar(100) NOT NULL,
	"key" varchar(100) NOT NULL,
	"type" varchar(20) DEFAULT 'string',
	"value" jsonb NOT NULL,
	CONSTRAINT "uq_metafield" UNIQUE("entity_type","entity_id","namespace","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."search_synonyms" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"term" varchar(100) NOT NULL,
	"synonyms" jsonb NOT NULL,
	CONSTRAINT "search_synonyms_term_unique" UNIQUE("term")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."smart_collections" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"slug" varchar(255) NOT NULL,
	"match_type" varchar(5) DEFAULT 'all' NOT NULL,
	"sort_by" varchar(50) DEFAULT 'best_selling',
	"image_url" text,
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"title" jsonb NOT NULL,
	"conditions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."tax_categories" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"priority" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"name" varchar(100) NOT NULL,
	"code" varchar(50),
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."tax_rules" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tax_category_id" uuid,
	"rate" integer NOT NULL,
	"priority" integer DEFAULT 0,
	"is_inclusive" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"name" varchar(100) NOT NULL,
	"country" varchar(2) NOT NULL,
	"state" varchar(100),
	"applies_to" varchar(20) DEFAULT 'all'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."currency_rates" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"from_currency" char(3) NOT NULL,
	"to_currency" char(3) NOT NULL,
	"rate" numeric(12, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"price_rule_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"used_count" integer DEFAULT 0,
	"code" varchar(50) NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."markets" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"default_currency" char(3) NOT NULL,
	"default_language" char(2) DEFAULT 'ar',
	"name" jsonb NOT NULL,
	"countries" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."price_lists" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"market_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"min_quantity" integer DEFAULT 1,
	"max_quantity" integer,
	"price" bigint NOT NULL,
	"compare_at_price" bigint,
	"currency" char(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."price_rules" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"value" bigint NOT NULL,
	"min_purchase_amount" bigint,
	"min_quantity" integer,
	"max_uses" integer,
	"max_uses_per_customer" integer,
	"used_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"type" "discount_type" NOT NULL,
	"applies_to" "discount_applies_to" DEFAULT 'all' NOT NULL,
	"title" jsonb NOT NULL,
	"entitled_ids" jsonb,
	"combines_with" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."menu_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"menu_type" varchar(20) NOT NULL,
	"parent_id" uuid,
	"label" varchar(100) NOT NULL,
	"url" varchar(255),
	"icon" varchar(50),
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."tenant_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"read_time_min" integer,
	"view_count" integer DEFAULT 0,
	"is_published" boolean DEFAULT false,
	"slug" varchar(255) NOT NULL,
	"category" varchar(100),
	"author_name" varchar(100),
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"featured_image" text,
	"tags" text[] DEFAULT '{}'::text[],
	"title" jsonb NOT NULL,
	"excerpt" jsonb,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."pages" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"is_published" boolean DEFAULT false,
	"slug" varchar(255) NOT NULL,
	"page_type" varchar(50) DEFAULT 'custom',
	"template" varchar(50) DEFAULT 'default',
	"meta_title" varchar(70),
	"meta_description" varchar(160),
	"title" jsonb NOT NULL,
	"content" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."coupons" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"value" bigint NOT NULL,
	"min_order_amount" bigint,
	"max_uses" integer,
	"used_count" integer DEFAULT 0,
	"max_uses_per_customer" integer,
	"is_active" boolean DEFAULT true,
	"code" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_default_billing" boolean DEFAULT false,
	"label" varchar(50),
	"name" varchar(255) NOT NULL,
	"line1" varchar(255) NOT NULL,
	"line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"postal_code" varchar(20) NOT NULL,
	"country" char(2) NOT NULL,
	"phone" varchar(20)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."customer_consents" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone,
	"consented" boolean NOT NULL,
	"channel" "consent_channel" NOT NULL,
	"source" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."customer_segments" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"customer_count" integer DEFAULT 0,
	"auto_update" boolean DEFAULT true,
	"match_type" varchar(5) DEFAULT 'all',
	"name" jsonb NOT NULL,
	"conditions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."customers" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_login_at" timestamp with time zone,
	"last_order_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"date_of_birth" date,
	"wallet_balance" bigint DEFAULT 0,
	"total_spent_amount" bigint DEFAULT 0,
	"loyalty_points" integer DEFAULT 0,
	"total_orders_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"accepts_marketing" boolean DEFAULT false,
	"email" text NOT NULL,
	"email_hash" char(64) NOT NULL,
	"password_hash" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"phone_hash" char(64),
	"avatar_url" text,
	"gender" varchar(10),
	"language" char(2) DEFAULT 'ar',
	"notes" text,
	"tags" text[] DEFAULT '{}'::text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" date,
	"is_default" boolean DEFAULT false,
	"provider" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"last_four" char(4),
	"brand" varchar(20),
	"token" text,
	"fingerprint" varchar(64),
	CONSTRAINT "uq_payment_fingerprint" UNIQUE("customer_id","fingerprint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."abandoned_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"recovered_at" timestamp with time zone,
	"subtotal" bigint,
	"recovery_email_sent" boolean DEFAULT false,
	"email" text,
	"items" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."affiliate_partners" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"commission_rate" integer DEFAULT 500 NOT NULL,
	"total_earned" bigint DEFAULT 0,
	"total_paid" bigint DEFAULT 0,
	"status" "affiliate_status" DEFAULT 'pending' NOT NULL,
	"referral_code" varchar(50) NOT NULL,
	CONSTRAINT "affiliate_partners_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."affiliate_transactions" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"paid_at" timestamp with time zone,
	"commission_amount" bigint NOT NULL,
	"status" "affiliate_tx_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."app_installations" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"app_name" varchar(255) NOT NULL,
	"api_key" text,
	"api_secret_hash" char(64),
	"webhook_url" text,
	"scopes" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."b2b_companies" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"credit_limit" bigint DEFAULT 0,
	"payment_terms_days" integer DEFAULT 30,
	"status" "b2b_company_status" DEFAULT 'pending' NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id" varchar(50),
	"industry" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."b2b_pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"company_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"price" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."b2b_users" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"role" "b2b_user_role" DEFAULT 'buyer' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"aggregate_type" varchar(50),
	"aggregate_id" uuid,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."product_views" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" varchar(64),
	"source" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"app_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"event" varchar(100) NOT NULL,
	"target_url" text NOT NULL,
	"secret" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."faq_categories" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."faqs" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"category_id" uuid,
	"question" varchar(500) NOT NULL,
	"answer" text NOT NULL,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."banners" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"priority" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"position" varchar(20) DEFAULT 'hero',
	"cta_text" varchar(50) DEFAULT 'Shop Now',
	"background_color" varchar(7),
	"text_color" varchar(7),
	"image_url" text NOT NULL,
	"mobile_image_url" text,
	"link_url" text,
	"title" jsonb NOT NULL,
	"subtitle" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."bento_grids" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" jsonb NOT NULL,
	"layout_id" varchar(50) NOT NULL,
	"slots" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."flash_sale_products" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"flash_sale_id" uuid,
	"product_id" uuid,
	"discount_basis_points" integer NOT NULL,
	"quantity_limit" integer NOT NULL,
	"sold_quantity" integer DEFAULT 0,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."flash_sales" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"end_time" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true,
	"name" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"unsubscribed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"email" text NOT NULL,
	"source" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."search_analytics" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"query" varchar(255) NOT NULL,
	"count" integer DEFAULT 1,
	"last_searched_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."import_errors" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"job_id" uuid,
	"row_number" integer NOT NULL,
	"row_data" jsonb,
	"error_message" text NOT NULL,
	"error_type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_rows" integer DEFAULT 0,
	"processed_rows" integer DEFAULT 0,
	"success_rows" integer DEFAULT 0,
	"error_rows" integer DEFAULT 0,
	"error_report_url" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."inventory_levels" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"location_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"available" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"incoming" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "uq_inventory_loc_var" UNIQUE("location_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text,
	"reference_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"cart_id" uuid,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."inventory_transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."inventory_transfers" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"from_location_id" uuid NOT NULL,
	"to_location_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"expected_arrival" timestamp with time zone,
	"status" "transfer_status" DEFAULT 'draft' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."locations" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"type" "location_type" DEFAULT 'warehouse' NOT NULL,
	"name" jsonb NOT NULL,
	"address" jsonb,
	"coordinates" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."kb_articles" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"category_id" uuid,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_published" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "kb_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."kb_categories" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"icon" varchar(50),
	"order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "kb_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."store_locations" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"coordinates" jsonb,
	"hours" jsonb,
	"phone_number" varchar(50),
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."loyalty_rules" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"points_per_currency" integer DEFAULT 1,
	"min_redeem_points" integer DEFAULT 100,
	"points_expiry_days" integer,
	"rewards" jsonb DEFAULT '[]'::jsonb,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'general',
	"is_read" boolean DEFAULT false,
	"metadata" varchar(500),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."fulfillment_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"fulfillment_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."fulfillments" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid NOT NULL,
	"location_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"status" "fulfillment_status" DEFAULT 'pending' NOT NULL,
	"tracking_company" varchar(100),
	"tracking_number" varchar(100),
	"tracking_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."order_edits" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid NOT NULL,
	"line_item_id" uuid,
	"edited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"amount_change" bigint DEFAULT 0,
	"edit_type" varchar(30) NOT NULL,
	"reason" text,
	"old_value" jsonb,
	"new_value" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"price" bigint NOT NULL,
	"total" bigint,
	"discount_amount" bigint DEFAULT 0,
	"tax_amount" bigint DEFAULT 0,
	"quantity" integer NOT NULL,
	"fulfilled_quantity" integer DEFAULT 0,
	"returned_quantity" integer DEFAULT 0,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"image_url" text,
	"attributes" jsonb,
	"tax_lines" jsonb,
	"discount_allocations" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."orders" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid,
	"market_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"subtotal" bigint NOT NULL,
	"discount" bigint DEFAULT 0,
	"shipping" bigint DEFAULT 0,
	"tax" bigint DEFAULT 0,
	"total" "public"."money_amount" NOT NULL,
	"coupon_discount" bigint DEFAULT 0,
	"refunded_amount" bigint DEFAULT 0,
	"risk_score" integer,
	"is_flagged" boolean DEFAULT false,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method",
	"source" "order_source" DEFAULT 'web',
	"order_number" varchar(20) NOT NULL,
	"currency" char(3) NOT NULL,
	"coupon_code" varchar(50),
	"tracking_number" varchar(100),
	"guest_email" varchar(255),
	"cancel_reason" text,
	"ip_address" text,
	"user_agent" text,
	"tracking_url" text,
	"notes" text,
	"tags" text[] DEFAULT '{}'::text[],
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."refund_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"refund_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."refunds" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid NOT NULL,
	"refunded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"amount" bigint NOT NULL,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"currency" char(3) NOT NULL,
	"gateway_transaction_id" varchar(255),
	"reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."rma_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"rma_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"restocking_fee" bigint DEFAULT 0,
	"reason_code" varchar(50) NOT NULL,
	"condition" varchar(20) NOT NULL,
	"resolution" varchar(20)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."payment_logs" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid,
	"provider" varchar(50) NOT NULL,
	"transaction_id" varchar(255),
	"provider_reference_id" varchar(255),
	"status" varchar(20) NOT NULL,
	"error_code" varchar(100),
	"error_message" text,
	"raw_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."back_in_stock_requests" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"product_id" uuid,
	"customer_id" uuid,
	"email" varchar(255) NOT NULL,
	"is_notified" boolean DEFAULT false,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."product_attributes" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0,
	"attribute_name" varchar(100) NOT NULL,
	"attribute_value" text NOT NULL,
	"attribute_group" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."product_bundle_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."product_bundles" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"discount_value" bigint DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"discount_type" varchar(20) DEFAULT 'percentage',
	"name" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."product_category_mapping" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	CONSTRAINT "product_category_mapping_product_id_category_id_unique" UNIQUE("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."product_images" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"product_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"url" text NOT NULL,
	"alt_text" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."product_tags" (
	"product_id" uuid NOT NULL,
	"tag" varchar(50) NOT NULL,
	CONSTRAINT "product_tags_product_id_tag_unique" UNIQUE("product_id","tag")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."_product_variants" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"product_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"price" bigint NOT NULL,
	"compare_at_price" bigint,
	"weight" integer,
	"version" integer DEFAULT 1,
	"sku" varchar(100),
	"barcode" varchar(50),
	"weight_unit" varchar(5) DEFAULT 'g',
	"image_url" text,
	"options" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."_products" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"brand_id" uuid,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"base_price" bigint NOT NULL,
	"sale_price" bigint,
	"cost_price" bigint,
	"compare_at_price" bigint,
	"tax_percentage" integer DEFAULT 0,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5,
	"sold_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"warranty_period" integer,
	"return_period" integer DEFAULT 14,
	"weight" integer,
	"min_order_qty" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_returnable" boolean DEFAULT true,
	"requires_shipping" boolean DEFAULT true,
	"is_digital" boolean DEFAULT false,
	"track_inventory" boolean DEFAULT true,
	"currency" varchar(3) DEFAULT 'SAR',
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
	"avg_rating" numeric(3, 2) DEFAULT '0',
	"tags" text[] DEFAULT '{}'::text[],
	"name" jsonb NOT NULL,
	"short_description" jsonb,
	"long_description" jsonb,
	"warranty_policy" jsonb,
	"package_contents" jsonb,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"dimensions" jsonb,
	"gallery_images" jsonb DEFAULT '[]'::jsonb,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."related_products" (
	"product_id" uuid NOT NULL,
	"related_product_id" uuid NOT NULL,
	"relation_type" varchar(20) DEFAULT 'similar' NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "related_products_product_id_related_product_id_unique" UNIQUE("product_id","related_product_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."referrals" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referred_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"converted_at" timestamp with time zone,
	"reward_amount" bigint,
	"is_reward_applied" boolean DEFAULT false,
	"referral_code" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."reviews" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"rating" smallint NOT NULL,
	"helpful_count" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false,
	"is_verified_purchase" boolean DEFAULT false,
	"title" varchar(100),
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."rma_requests" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"reason" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"resolution" varchar(50),
	"description" text,
	"evidence" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"base_price" bigint NOT NULL,
	"free_shipping_threshold" bigint,
	"min_delivery_days" integer,
	"max_delivery_days" integer,
	"is_active" boolean DEFAULT true,
	"name" varchar(100) NOT NULL,
	"region" varchar(100) NOT NULL,
	"country" varchar(2),
	"carrier" varchar(50),
	"estimated_days" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."size_guides" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" uuid,
	"product_id" uuid,
	"table_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."staff_members" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_login_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."staff_roles" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_system" boolean DEFAULT false,
	"name" varchar(100) NOT NULL,
	"permissions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."staff_sessions" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"token_hash" char(64) NOT NULL,
	"device_fingerprint" varchar(64),
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"po_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity_ordered" integer NOT NULL,
	"quantity_received" integer DEFAULT 0,
	"unit_cost" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"expected_arrival" timestamp with time zone,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"subtotal" bigint DEFAULT 0,
	"tax" bigint DEFAULT 0,
	"shipping_cost" bigint DEFAULT 0,
	"total" bigint DEFAULT 0,
	"currency" char(3) DEFAULT 'USD',
	"order_number" varchar(20),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."suppliers" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"lead_time_days" integer,
	"currency" char(3) DEFAULT 'USD',
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"company" text,
	"notes" text,
	"address" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."order_timeline" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"status" varchar(50) NOT NULL,
	"title" jsonb,
	"notes" text,
	"location" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storefront"."wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"amount" "public"."money_amount" NOT NULL,
	"balance_after" "public"."money_amount" NOT NULL,
	"type" varchar(20) NOT NULL,
	"reason" varchar(100) NOT NULL,
	"description" text,
	CONSTRAINT "wallet_non_negative_balance" CHECK ((balance_after).amount >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."wishlists" (
	"customer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "wishlists_customer_id_product_id_unique" UNIQUE("customer_id","product_id")
);
--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'app_usage_records_tenant_id_tenants_id_fk' AND t.relname = 'app_usage_records' AND n.nspname = 'governance') THEN ALTER TABLE "governance"."app_usage_records" ADD CONSTRAINT "app_usage_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'dunning_events_tenant_id_tenants_id_fk' AND t.relname = 'dunning_events' AND n.nspname = 'governance') THEN ALTER TABLE "governance"."dunning_events" ADD CONSTRAINT "dunning_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'feature_gates_tenant_id_tenants_id_fk' AND t.relname = 'feature_gates' AND n.nspname = 'governance') THEN ALTER TABLE "governance"."feature_gates" ADD CONSTRAINT "feature_gates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'leads_converted_tenant_id_tenants_id_fk' AND t.relname = 'leads' AND n.nspname = 'governance') THEN ALTER TABLE "governance"."leads" ADD CONSTRAINT "leads_converted_tenant_id_tenants_id_fk" FOREIGN KEY ("converted_tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'plan_change_history_tenant_id_tenants_id_fk' AND t.relname = 'plan_change_history' AND n.nspname = 'governance') THEN ALTER TABLE "governance"."plan_change_history" ADD CONSTRAINT "plan_change_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'tenant_invoices_tenant_id_tenants_id_fk' AND t.relname = 'tenant_invoices' AND n.nspname = 'governance') THEN ALTER TABLE "governance"."tenant_invoices" ADD CONSTRAINT "tenant_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'tenant_quotas_tenant_id_tenants_id_fk' AND t.relname = 'tenant_quotas' AND n.nspname = 'governance') THEN ALTER TABLE "governance"."tenant_quotas" ADD CONSTRAINT "tenant_quotas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'tenant_migrations_tenant_id_tenants_id_fk' AND t.relname = 'tenant_migrations' AND n.nspname = 'public') THEN ALTER TABLE "public"."tenant_migrations" ADD CONSTRAINT "tenant_migrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "governance"."tenants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'auth_logs_customer_id_customers_id_fk' AND t.relname = 'auth_logs' AND n.nspname = 'public') THEN ALTER TABLE "public"."auth_logs" ADD CONSTRAINT "auth_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'otp_codes_customer_id_customers_id_fk' AND t.relname = 'otp_codes' AND n.nspname = 'public') THEN ALTER TABLE "public"."otp_codes" ADD CONSTRAINT "otp_codes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'carts_customer_id_customers_id_fk' AND t.relname = 'carts' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'categories_parent_id_categories_id_fk' AND t.relname = 'categories' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "storefront"."categories"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'tax_rules_tax_category_id_tax_categories_id_fk' AND t.relname = 'tax_rules' AND n.nspname = 'public') THEN ALTER TABLE "public"."tax_rules" ADD CONSTRAINT "tax_rules_tax_category_id_tax_categories_id_fk" FOREIGN KEY ("tax_category_id") REFERENCES "public"."tax_categories"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'discount_codes_price_rule_id_price_rules_id_fk' AND t.relname = 'discount_codes' AND n.nspname = 'public') THEN ALTER TABLE "public"."discount_codes" ADD CONSTRAINT "discount_codes_price_rule_id_price_rules_id_fk" FOREIGN KEY ("price_rule_id") REFERENCES "public"."price_rules"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'price_lists_market_id_markets_id_fk' AND t.relname = 'price_lists' AND n.nspname = 'public') THEN ALTER TABLE "public"."price_lists" ADD CONSTRAINT "price_lists_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'price_lists_product_id_products_id_fk' AND t.relname = 'price_lists' AND n.nspname = 'public') THEN ALTER TABLE "public"."price_lists" ADD CONSTRAINT "price_lists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'price_lists_variant_id_product_variants_id_fk' AND t.relname = 'price_lists' AND n.nspname = 'public') THEN ALTER TABLE "public"."price_lists" ADD CONSTRAINT "price_lists_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "storefront"."_product_variants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'menu_items_parent_id_menu_items_id_fk' AND t.relname = 'menu_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_parent_id_menu_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'customer_addresses_customer_id_customers_id_fk' AND t.relname = 'customer_addresses' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'customer_consents_customer_id_customers_id_fk' AND t.relname = 'customer_consents' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."customer_consents" ADD CONSTRAINT "customer_consents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'payment_methods_customer_id_customers_id_fk' AND t.relname = 'payment_methods' AND n.nspname = 'public') THEN ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'abandoned_checkouts_customer_id_customers_id_fk' AND t.relname = 'abandoned_checkouts' AND n.nspname = 'public') THEN ALTER TABLE "public"."abandoned_checkouts" ADD CONSTRAINT "abandoned_checkouts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'affiliate_partners_customer_id_customers_id_fk' AND t.relname = 'affiliate_partners' AND n.nspname = 'public') THEN ALTER TABLE "public"."affiliate_partners" ADD CONSTRAINT "affiliate_partners_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'affiliate_transactions_partner_id_affiliate_partners_id_fk' AND t.relname = 'affiliate_transactions' AND n.nspname = 'public') THEN ALTER TABLE "public"."affiliate_transactions" ADD CONSTRAINT "affiliate_transactions_partner_id_affiliate_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."affiliate_partners"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'affiliate_transactions_order_id_orders_id_fk' AND t.relname = 'affiliate_transactions' AND n.nspname = 'public') THEN ALTER TABLE "public"."affiliate_transactions" ADD CONSTRAINT "affiliate_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'b2b_pricing_tiers_company_id_b2b_companies_id_fk' AND t.relname = 'b2b_pricing_tiers' AND n.nspname = 'public') THEN ALTER TABLE "public"."b2b_pricing_tiers" ADD CONSTRAINT "b2b_pricing_tiers_company_id_b2b_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."b2b_companies"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'b2b_pricing_tiers_product_id_products_id_fk' AND t.relname = 'b2b_pricing_tiers' AND n.nspname = 'public') THEN ALTER TABLE "public"."b2b_pricing_tiers" ADD CONSTRAINT "b2b_pricing_tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'b2b_users_company_id_b2b_companies_id_fk' AND t.relname = 'b2b_users' AND n.nspname = 'public') THEN ALTER TABLE "public"."b2b_users" ADD CONSTRAINT "b2b_users_company_id_b2b_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."b2b_companies"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'b2b_users_customer_id_customers_id_fk' AND t.relname = 'b2b_users' AND n.nspname = 'public') THEN ALTER TABLE "public"."b2b_users" ADD CONSTRAINT "b2b_users_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'webhook_subscriptions_app_id_app_installations_id_fk' AND t.relname = 'webhook_subscriptions' AND n.nspname = 'public') THEN ALTER TABLE "public"."webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_app_id_app_installations_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app_installations"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'faqs_category_id_faq_categories_id_fk' AND t.relname = 'faqs' AND n.nspname = 'public') THEN ALTER TABLE "public"."faqs" ADD CONSTRAINT "faqs_category_id_faq_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."faq_categories"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'flash_sale_products_flash_sale_id_flash_sales_id_fk' AND t.relname = 'flash_sale_products' AND n.nspname = 'public') THEN ALTER TABLE "public"."flash_sale_products" ADD CONSTRAINT "flash_sale_products_flash_sale_id_flash_sales_id_fk" FOREIGN KEY ("flash_sale_id") REFERENCES "public"."flash_sales"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'flash_sale_products_product_id_products_id_fk' AND t.relname = 'flash_sale_products' AND n.nspname = 'public') THEN ALTER TABLE "public"."flash_sale_products" ADD CONSTRAINT "flash_sale_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'import_errors_job_id_import_jobs_id_fk' AND t.relname = 'import_errors' AND n.nspname = 'public') THEN ALTER TABLE "public"."import_errors" ADD CONSTRAINT "import_errors_job_id_import_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."import_jobs"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_levels_location_id_locations_id_fk' AND t.relname = 'inventory_levels' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_levels_variant_id_product_variants_id_fk' AND t.relname = 'inventory_levels' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "storefront"."_product_variants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_movements_variant_id_product_variants_id_fk' AND t.relname = 'inventory_movements' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "storefront"."_product_variants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_movements_location_id_locations_id_fk' AND t.relname = 'inventory_movements' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_reservations_variant_id_product_variants_id_fk' AND t.relname = 'inventory_reservations' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "storefront"."_product_variants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_reservations_location_id_locations_id_fk' AND t.relname = 'inventory_reservations' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_transfer_items_transfer_id_inventory_transfers_id_fk' AND t.relname = 'inventory_transfer_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_transfer_items" ADD CONSTRAINT "inventory_transfer_items_transfer_id_inventory_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."inventory_transfers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_transfer_items_variant_id_product_variants_id_fk' AND t.relname = 'inventory_transfer_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_transfer_items" ADD CONSTRAINT "inventory_transfer_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "storefront"."_product_variants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_transfers_from_location_id_locations_id_fk' AND t.relname = 'inventory_transfers' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_transfers" ADD CONSTRAINT "inventory_transfers_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'inventory_transfers_to_location_id_locations_id_fk' AND t.relname = 'inventory_transfers' AND n.nspname = 'public') THEN ALTER TABLE "public"."inventory_transfers" ADD CONSTRAINT "inventory_transfers_to_location_id_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'kb_articles_category_id_kb_categories_id_fk' AND t.relname = 'kb_articles' AND n.nspname = 'public') THEN ALTER TABLE "public"."kb_articles" ADD CONSTRAINT "kb_articles_category_id_kb_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kb_categories"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'notifications_customer_id_customers_id_fk' AND t.relname = 'notifications' AND n.nspname = 'public') THEN ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'fulfillment_items_fulfillment_id_fulfillments_id_fk' AND t.relname = 'fulfillment_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."fulfillment_items" ADD CONSTRAINT "fulfillment_items_fulfillment_id_fulfillments_id_fk" FOREIGN KEY ("fulfillment_id") REFERENCES "storefront"."fulfillments"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'fulfillment_items_order_item_id_order_items_id_fk' AND t.relname = 'fulfillment_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."fulfillment_items" ADD CONSTRAINT "fulfillment_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'fulfillments_order_id_orders_id_fk' AND t.relname = 'fulfillments' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."fulfillments" ADD CONSTRAINT "fulfillments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'order_edits_order_id_orders_id_fk' AND t.relname = 'order_edits' AND n.nspname = 'public') THEN ALTER TABLE "public"."order_edits" ADD CONSTRAINT "order_edits_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'order_edits_line_item_id_order_items_id_fk' AND t.relname = 'order_edits' AND n.nspname = 'public') THEN ALTER TABLE "public"."order_edits" ADD CONSTRAINT "order_edits_line_item_id_order_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'order_items_order_id_orders_id_fk' AND t.relname = 'order_items' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'orders_customer_id_customers_id_fk' AND t.relname = 'orders' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'refund_items_refund_id_refunds_id_fk' AND t.relname = 'refund_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."refund_items" ADD CONSTRAINT "refund_items_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'refund_items_order_item_id_order_items_id_fk' AND t.relname = 'refund_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."refund_items" ADD CONSTRAINT "refund_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'refunds_order_id_orders_id_fk' AND t.relname = 'refunds' AND n.nspname = 'public') THEN ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'rma_items_order_item_id_order_items_id_fk' AND t.relname = 'rma_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."rma_items" ADD CONSTRAINT "rma_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'payment_logs_order_id_orders_id_fk' AND t.relname = 'payment_logs' AND n.nspname = 'public') THEN ALTER TABLE "public"."payment_logs" ADD CONSTRAINT "payment_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'back_in_stock_requests_product_id_products_id_fk' AND t.relname = 'back_in_stock_requests' AND n.nspname = 'public') THEN ALTER TABLE "public"."back_in_stock_requests" ADD CONSTRAINT "back_in_stock_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'back_in_stock_requests_customer_id_customers_id_fk' AND t.relname = 'back_in_stock_requests' AND n.nspname = 'public') THEN ALTER TABLE "public"."back_in_stock_requests" ADD CONSTRAINT "back_in_stock_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_attributes_product_id_products_id_fk' AND t.relname = 'product_attributes' AND n.nspname = 'public') THEN ALTER TABLE "public"."product_attributes" ADD CONSTRAINT "product_attributes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_bundle_items_bundle_id_product_bundles_id_fk' AND t.relname = 'product_bundle_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."product_bundle_items" ADD CONSTRAINT "product_bundle_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_bundle_items_product_id_products_id_fk' AND t.relname = 'product_bundle_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."product_bundle_items" ADD CONSTRAINT "product_bundle_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_category_mapping_product_id_products_id_fk' AND t.relname = 'product_category_mapping' AND n.nspname = 'public') THEN ALTER TABLE "public"."product_category_mapping" ADD CONSTRAINT "product_category_mapping_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_category_mapping_category_id_categories_id_fk' AND t.relname = 'product_category_mapping' AND n.nspname = 'public') THEN ALTER TABLE "public"."product_category_mapping" ADD CONSTRAINT "product_category_mapping_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "storefront"."categories"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_images_product_id_products_id_fk' AND t.relname = 'product_images' AND n.nspname = 'public') THEN ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_tags_product_id_products_id_fk' AND t.relname = 'product_tags' AND n.nspname = 'public') THEN ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'product_variants_product_id_products_id_fk' AND t.relname = '_product_variants' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."_product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'products_brand_id_brands_id_fk' AND t.relname = '_products' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."_products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "storefront"."brands"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'products_category_id_categories_id_fk' AND t.relname = '_products' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."_products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "storefront"."categories"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'related_products_product_id_products_id_fk' AND t.relname = 'related_products' AND n.nspname = 'public') THEN ALTER TABLE "public"."related_products" ADD CONSTRAINT "related_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'related_products_related_product_id_products_id_fk' AND t.relname = 'related_products' AND n.nspname = 'public') THEN ALTER TABLE "public"."related_products" ADD CONSTRAINT "related_products_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'referrals_referrer_id_customers_id_fk' AND t.relname = 'referrals' AND n.nspname = 'public') THEN ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referrer_id_customers_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'referrals_referred_id_customers_id_fk' AND t.relname = 'referrals' AND n.nspname = 'public') THEN ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referred_id_customers_id_fk" FOREIGN KEY ("referred_id") REFERENCES "storefront"."customers"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'reviews_product_id_products_id_fk' AND t.relname = 'reviews' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'reviews_customer_id_customers_id_fk' AND t.relname = 'reviews' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'reviews_order_id_orders_id_fk' AND t.relname = 'reviews' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'rma_requests_order_id_orders_id_fk' AND t.relname = 'rma_requests' AND n.nspname = 'public') THEN ALTER TABLE "public"."rma_requests" ADD CONSTRAINT "rma_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'rma_requests_order_item_id_order_items_id_fk' AND t.relname = 'rma_requests' AND n.nspname = 'public') THEN ALTER TABLE "public"."rma_requests" ADD CONSTRAINT "rma_requests_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'size_guides_category_id_categories_id_fk' AND t.relname = 'size_guides' AND n.nspname = 'public') THEN ALTER TABLE "public"."size_guides" ADD CONSTRAINT "size_guides_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "storefront"."categories"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'size_guides_product_id_products_id_fk' AND t.relname = 'size_guides' AND n.nspname = 'public') THEN ALTER TABLE "public"."size_guides" ADD CONSTRAINT "size_guides_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE no action ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'staff_members_role_id_staff_roles_id_fk' AND t.relname = 'staff_members' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."staff_members" ADD CONSTRAINT "staff_members_role_id_staff_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "storefront"."staff_roles"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'staff_sessions_staff_id_staff_members_id_fk' AND t.relname = 'staff_sessions' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."staff_sessions" ADD CONSTRAINT "staff_sessions_staff_id_staff_members_id_fk" FOREIGN KEY ("staff_id") REFERENCES "storefront"."staff_members"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'purchase_order_items_po_id_purchase_orders_id_fk' AND t.relname = 'purchase_order_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'purchase_order_items_variant_id_product_variants_id_fk' AND t.relname = 'purchase_order_items' AND n.nspname = 'public') THEN ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "storefront"."_product_variants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'purchase_orders_supplier_id_suppliers_id_fk' AND t.relname = 'purchase_orders' AND n.nspname = 'public') THEN ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'purchase_orders_location_id_locations_id_fk' AND t.relname = 'purchase_orders' AND n.nspname = 'public') THEN ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'order_timeline_order_id_orders_id_fk' AND t.relname = 'order_timeline' AND n.nspname = 'public') THEN ALTER TABLE "public"."order_timeline" ADD CONSTRAINT "order_timeline_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'wallet_transactions_customer_id_customers_id_fk' AND t.relname = 'wallet_transactions' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'wallet_transactions_order_id_orders_id_fk' AND t.relname = 'wallet_transactions' AND n.nspname = 'storefront') THEN ALTER TABLE "storefront"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'wishlists_customer_id_customers_id_fk' AND t.relname = 'wishlists' AND n.nspname = 'public') THEN ALTER TABLE "public"."wishlists" ADD CONSTRAINT "wishlists_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid JOIN pg_namespace n ON t.relnamespace = n.oid WHERE c.conname = 'wishlists_product_id_products_id_fk' AND t.relname = 'wishlists' AND n.nspname = 'public') THEN ALTER TABLE "public"."wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."_products"("id") ON DELETE restrict ON UPDATE no action; END IF; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "governance"."audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_idx" ON "governance"."audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "governance"."audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "governance"."audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_email_hash" ON "governance"."leads" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_status" ON "governance"."leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_tenant" ON "governance"."tenant_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "governance"."tenant_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blueprint_niche_plan_idx" ON "governance"."onboarding_blueprints" USING btree ("niche_type","plan");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_migrations_tenant_idx" ON "public"."tenant_migrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_brands_slug_active" ON "storefront"."brands" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_brands_active" ON "storefront"."brands" USING btree ("is_active") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_carts_customer" ON "storefront"."carts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_carts_session" ON "storefront"."carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_carts_expires" ON "storefront"."carts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_categories_slug_active" ON "storefront"."categories" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_categories_parent" ON "storefront"."categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_categories_active" ON "storefront"."categories" USING btree ("is_active") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_metafields_lookup" ON "public"."entity_metafields" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_collections_slug" ON "public"."smart_collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_rules_country" ON "public"."tax_rules" USING btree ("country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discount_code" ON "public"."discount_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_price_list_market" ON "public"."price_lists" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_price_list_product" ON "public"."price_lists" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_price_rules_active" ON "public"."price_rules" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_menu_items_type" ON "public"."menu_items" USING btree ("menu_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_menu_items_parent" ON "public"."menu_items" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_menu_items_active" ON "public"."menu_items" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_slug_active" ON "public"."blog_posts" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_published" ON "public"."blog_posts" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_published_at" ON "public"."blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blog_tags" ON "public"."blog_posts" USING btree ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pages_slug_active" ON "storefront"."pages" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pages_published" ON "storefront"."pages" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coupons_code" ON "storefront"."coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coupons_active" ON "storefront"."coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_addresses_customer" ON "storefront"."customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consent_customer" ON "storefront"."customer_consents" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_email_hash" ON "storefront"."customers" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_active" ON "storefront"."customers" USING btree ("created_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_tags" ON "storefront"."customers" USING btree ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_customer" ON "public"."payment_methods" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_abandoned_created" ON "public"."abandoned_checkouts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aff_partner" ON "public"."affiliate_transactions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aff_order" ON "public"."affiliate_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_b2b_pricing" ON "public"."b2b_pricing_tiers" USING btree ("company_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_b2b_user" ON "public"."b2b_users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outbox_pending" ON "public"."outbox_events" USING btree ("status","created_at") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_views_product" ON "public"."product_views" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_views_created" ON "public"."product_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_app" ON "public"."webhook_subscriptions" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_event" ON "public"."webhook_subscriptions" USING btree ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_faq_category" ON "public"."faqs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_faq_active" ON "public"."faqs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_banners_active" ON "public"."banners" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_banners_priority" ON "public"."banners" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fs_prod_campaign" ON "public"."flash_sale_products" USING btree ("flash_sale_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fs_prod_product" ON "public"."flash_sale_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flash_sales_status" ON "public"."flash_sales" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flash_sales_end_time" ON "public"."flash_sales" USING btree ("end_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletter_active" ON "public"."newsletter_subscribers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_query" ON "public"."search_analytics" USING btree ("query");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_import_errors_job" ON "public"."import_errors" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_import_jobs_tenant" ON "public"."import_jobs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_variant" ON "public"."inventory_levels" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_mov_variant" ON "public"."inventory_movements" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_mov_created" ON "public"."inventory_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_res_active" ON "public"."inventory_reservations" USING btree ("status") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_res_expires" ON "public"."inventory_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transfer_items" ON "public"."inventory_transfer_items" USING btree ("transfer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kb_article_slug" ON "public"."kb_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_location_name" ON "public"."store_locations" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fulfill_items" ON "public"."fulfillment_items" USING btree ("fulfillment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fulfillments_order" ON "storefront"."fulfillments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_edits" ON "public"."order_edits" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "storefront"."order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_number_active" ON "storefront"."orders" USING btree ("order_number") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_admin" ON "storefront"."orders" USING btree ("status","created_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_customer" ON "storefront"."orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_created" ON "storefront"."orders" USING brin ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refund_items" ON "public"."refund_items" USING btree ("refund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refunds_order" ON "public"."refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rma_items_rma" ON "public"."rma_items" USING btree ("rma_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attrs_product" ON "public"."product_attributes" USING btree ("product_id","attribute_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bundle_items" ON "public"."product_bundle_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_images_product" ON "public"."product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variant_sku_active" ON "storefront"."_product_variants" USING btree ("sku") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variants_product" ON "storefront"."_product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_sku_active" ON "storefront"."_products" USING btree ("sku") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_slug_active" ON "storefront"."_products" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_active" ON "storefront"."_products" USING btree ("category_id") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_featured" ON "storefront"."_products" USING btree ("is_featured") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_tags" ON "storefront"."_products" USING btree ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_name" ON "storefront"."_products" USING gin ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_brand" ON "storefront"."_products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_referral_code" ON "public"."referrals" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_referral_referrer" ON "public"."referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_product" ON "storefront"."reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_approved" ON "storefront"."reviews" USING btree ("is_approved") WHERE is_approved = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_customer" ON "storefront"."reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rma_order" ON "public"."rma_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rma_status" ON "public"."rma_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipping_region" ON "storefront"."shipping_zones" USING btree ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipping_active" ON "storefront"."shipping_zones" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_user" ON "storefront"."staff_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_active" ON "storefront"."staff_members" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_token" ON "storefront"."staff_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_active" ON "storefront"."staff_sessions" USING btree ("staff_id") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_items" ON "public"."purchase_order_items" USING btree ("po_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_supplier" ON "public"."purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_status" ON "public"."purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_timeline_order" ON "public"."order_timeline" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_timeline_created" ON "public"."order_timeline" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wallet_customer" ON "storefront"."wallet_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wallet_created" ON "storefront"."wallet_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE POLICY "tenants_isolation" ON "governance"."tenants" AS PERMISSIVE FOR SELECT TO public USING (status = 'active');

ALTER TABLE "governance"."tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storefront"."wallet_transactions" ENABLE ROW LEVEL SECURITY;

-- Audit 444 #35: Revoke pg_cron public access
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN EXECUTE 'REVOKE ALL ON TABLE cron.job FROM public'; EXECUTE 'GRANT SELECT ON TABLE cron.job TO postgres'; END IF; END $$;

-- Risk #8: Soft Delete Enforcement Views
CREATE OR REPLACE VIEW storefront.products AS SELECT * FROM storefront._products WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW storefront.product_variants AS SELECT * FROM storefront._product_variants WHERE deleted_at IS NULL;