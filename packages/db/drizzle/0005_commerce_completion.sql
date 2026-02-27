-- Phase 8 Commerce Completion Migration

CREATE TABLE IF NOT EXISTS "storefront"."customer_segments" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."affiliate_partners" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"status" "affiliate_status" DEFAULT 'pending' NOT NULL,
	"code" text NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "affiliate_partners_code_unique" UNIQUE("code")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."affiliate_transactions" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"amount" "money_amount" NOT NULL,
	"status" "affiliate_tx_status" DEFAULT 'pending' NOT NULL,
	"reference_order_id" text
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."app_installations" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"app_key" text NOT NULL,
	"access_token" text NOT NULL,
	"scope" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."b2b_companies" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"status" "b2b_company_status" DEFAULT 'active' NOT NULL,
	"name" text NOT NULL,
	"tax_registration_number" text,
	"billing_email" text
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."b2b_pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"discount_basis_points" integer NOT NULL,
	"name" text NOT NULL,
	"product_id" uuid NOT NULL,
	"min_quantity" integer DEFAULT 0 NOT NULL,
	"max_quantity" integer
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."b2b_users" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"unit_price" "money_amount" DEFAULT '(0,SAR)'::money_amount NOT NULL,
	"role" text DEFAULT 'member' NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"topic" text NOT NULL,
	"address" text NOT NULL,
	"format" text DEFAULT 'json',
	"secret" bytea NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."rma_items" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "qty_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "storefront"."rma_requests" (
	"id" uuid PRIMARY KEY DEFAULT public.gen_ulid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"reason_code" "rma_reason_code" NOT NULL,
	"condition" "rma_condition" DEFAULT 'new' NOT NULL,
	"resolution" "rma_resolution" DEFAULT 'refund' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"evidence" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint

-- ─── PATCH: STAFF SCHEMA (Building on 0001_baseline) ──────────────
-- staff_members: Add missing audit/soft-delete columns
DO $$ BEGIN ALTER TABLE "storefront"."staff_members" 
ADD COLUMN IF NOT EXISTS "last_login_at" timestamp (6) with time zone,
ADD COLUMN IF NOT EXISTS "deleted_at" timestamp (6) with time zone; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint

-- staff_roles: Add description and strict permission check
DO $$ BEGIN 
    ALTER TABLE "storefront"."staff_roles" DROP CONSTRAINT IF EXISTS "permissions_strict_keys";
    ALTER TABLE "storefront"."staff_roles"
    ADD CONSTRAINT "permissions_strict_keys" CHECK (
        jsonb_typeof("permissions") = 'object' 
        AND ("permissions" - array['products', 'orders', 'customers', 'settings', 'promotions', 'analytics'] = '{}'::jsonb)
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint

-- staff_sessions: Ensure session salt version is present
DO $$ BEGIN 
    ALTER TABLE "storefront"."staff_sessions" ADD COLUMN IF NOT EXISTS "session_salt_version" integer DEFAULT 1 NOT NULL;
    ALTER TABLE "storefront"."staff_sessions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp (6) with time zone; 
EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_aff_trans_created_brin" ON "storefront"."affiliate_transactions" USING brin ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_b2b_tier_collision" ON "storefront"."b2b_pricing_tiers" USING gist (int4range("min_quantity", COALESCE("max_quantity", 2147483647), '[]'));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rma_order" ON "storefront"."rma_requests" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rma_status" ON "storefront"."rma_requests" USING btree ("status");
--> statement-breakpoint

ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "total_spent" "money_amount" DEFAULT '(0,SAR)'::money_amount NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "total_orders" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "last_order_at" timestamp (6) with time zone;
--> statement-breakpoint
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "gender" text;
--> statement-breakpoint
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'ar' NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "date_of_birth" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "risk_score" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "payment_method" text;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "coupon_code" text;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "cancel_reason" text;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "ip_address" text;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "user_agent" text;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "fulfilled_quantity" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "returned_quantity" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "tax_lines" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "discount_allocations" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "customer_id" uuid;
--> statement-breakpoint
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "subtotal" "money_amount";
--> statement-breakpoint
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "recovery_email_sent" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "recovered_at" timestamp (6) with time zone;
--> statement-breakpoint

ALTER TABLE "storefront"."affiliate_transactions" DROP CONSTRAINT IF EXISTS "affiliate_transactions_partner_id_affiliate_partners_id_fk";
--> statement-breakpoint
ALTER TABLE "storefront"."affiliate_transactions" ADD CONSTRAINT "affiliate_transactions_partner_id_affiliate_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "storefront"."affiliate_partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
--> statement-breakpoint

ALTER TABLE "storefront"."b2b_pricing_tiers" DROP CONSTRAINT IF EXISTS "b2b_pricing_tiers_company_id_b2b_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "storefront"."b2b_pricing_tiers" ADD CONSTRAINT "b2b_pricing_tiers_company_id_b2b_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "storefront"."b2b_companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
--> statement-breakpoint

ALTER TABLE "storefront"."b2b_users" DROP CONSTRAINT IF EXISTS "b2b_users_company_id_b2b_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "storefront"."b2b_users" ADD CONSTRAINT "b2b_users_company_id_b2b_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "storefront"."b2b_companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
--> statement-breakpoint

ALTER TABLE "storefront"."rma_items" DROP CONSTRAINT IF EXISTS "rma_items_order_item_id_order_items_id_fk";
--> statement-breakpoint
ALTER TABLE "storefront"."rma_items" ADD CONSTRAINT "rma_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint

ALTER TABLE "storefront"."rma_requests" DROP CONSTRAINT IF EXISTS "rma_requests_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "storefront"."rma_requests" ADD CONSTRAINT "rma_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint

ALTER TABLE "storefront"."rma_requests" DROP CONSTRAINT IF EXISTS "rma_requests_order_item_id_order_items_id_fk";
--> statement-breakpoint
ALTER TABLE "storefront"."rma_requests" ADD CONSTRAINT "rma_requests_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "storefront"."order_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint
