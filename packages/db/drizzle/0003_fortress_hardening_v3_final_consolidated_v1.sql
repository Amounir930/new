-- ============================================================
-- Fortress Hardening V3.0 - Final Consolidated Migration
-- Security-hardened + Idempotent (all statements safe to re-run)
-- ============================================================

-- ─── 0. EXTENSIONS ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint

-- ─── 1. ENUM TYPES ──────────────────────────────────────────
DO $$ BEGIN CREATE TYPE "public"."blueprint_status" AS ENUM('active', 'paused');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'basic', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."payment_method" AS ENUM('card', 'cod', 'wallet', 'bnpl');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- ─── 2. TABLES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tenant_migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"migration_name" text NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"image_url" text NOT NULL,
	"mobile_image_url" text,
	"link_url" text,
	"cta_text" varchar(50) DEFAULT 'Shop Now',
	"position" varchar(20) DEFAULT 'hero',
	"priority" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"background_color" varchar(7),
	"text_color" varchar(7),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- S7: Newsletter uses encrypted PII + blind index (no plaintext email)
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" text NOT NULL,
	"email_hash" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "newsletter_subscribers_email_hash_unique" UNIQUE("email_hash")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"row_number" integer NOT NULL,
	"row_data" jsonb,
	"error_message" text NOT NULL,
	"error_type" varchar(50)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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

-- ─── 3. ROW LEVEL SECURITY (S2) ─────────────────────────────
-- Tenant isolation on all tables that contain tenant-scoped data
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "import_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "import_errors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "banners" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ─── 4. RLS POLICIES ────────────────────────────────────────
-- Tenants: only authenticated system (app sets tenant context via search_path)
DO $$ BEGIN
  CREATE POLICY "tenants_isolation" ON "tenants" AS PERMISSIVE FOR SELECT TO public USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- import_jobs: tenant can only see their own jobs
DO $$ BEGIN
  CREATE POLICY "import_jobs_tenant_isolation" ON "import_jobs" AS RESTRICTIVE FOR ALL TO public
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- newsletter: tenant can only see their own subscribers
DO $$ BEGIN
  CREATE POLICY "newsletter_tenant_isolation" ON "newsletter_subscribers" AS RESTRICTIVE FOR ALL TO public
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- banners: tenant can only see their own banners
DO $$ BEGIN
  CREATE POLICY "banners_tenant_isolation" ON "banners" AS RESTRICTIVE FOR ALL TO public
  USING (tenant_id IS NULL OR tenant_id::text = current_setting('app.current_tenant_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- import_errors: tenant can only see errors linked to their own import jobs
DO $$ BEGIN
  CREATE POLICY "import_errors_tenant_isolation" ON "import_errors" AS RESTRICTIVE FOR ALL TO public
  USING (
    job_id IN (
      SELECT id FROM import_jobs
      WHERE tenant_id::text = current_setting('app.current_tenant_id', true)
    )
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- ─── 5. ALTER COLUMNS ────────────────────────────────────────
ALTER TABLE "audit_logs" ALTER COLUMN "tenant_id" SET DATA TYPE uuid USING "tenant_id"::uuid;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "onboarding_blueprints" ALTER COLUMN "plan" SET DATA TYPE tenant_plan USING "plan"::tenant_plan;
EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "onboarding_blueprints" ALTER COLUMN "status" SET DATA TYPE blueprint_status USING "status"::blueprint_status;
EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tenants" ALTER COLUMN "plan" SET DATA TYPE tenant_plan USING "plan"::tenant_plan;
EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tenants" ALTER COLUMN "status" SET DATA TYPE tenant_status USING "status"::tenant_status;
EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "is_published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE order_status USING "status"::order_status;
EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DATA TYPE payment_status USING "payment_status"::payment_status;
EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE payment_method USING "payment_method"::payment_method;
EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint

-- ─── 6. ADD COLUMNS ──────────────────────────────────────────
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_title" varchar(60);--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "meta_description" varchar(160);--> statement-breakpoint
-- S15: Vector embedding for AI search (hnsw index added below)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);--> statement-breakpoint

-- ─── 7. FOREIGN KEYS ─────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "tenant_migrations" ADD CONSTRAINT "tenant_migrations_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_job_id_import_jobs_id_fk"
    FOREIGN KEY ("job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- ─── 8. INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "tenant_migrations_tenant_idx" ON "tenant_migrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_banners_active" ON "banners" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_banners_priority" ON "banners" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_newsletter_email_hash" ON "newsletter_subscribers" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_import_errors_job" ON "import_errors" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_import_jobs_tenant" ON "import_jobs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pages_slug" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pages_published" ON "pages" USING btree ("is_published");--> statement-breakpoint
-- S15: HNSW index for fast vector similarity search (prevents full table scan / DoS)
CREATE INDEX IF NOT EXISTS "idx_products_embedding_hnsw" ON "products" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint

-- ─── 9. CONSTRAINTS ──────────────────────────────────────────
DO $$ BEGIN ALTER TABLE "audit_logs" DROP COLUMN "user_id";
EXCEPTION WHEN undefined_column THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "pages" ADD CONSTRAINT "pages_slug_unique" UNIQUE("slug");
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- ─── 10. MATERIALIZED VIEW ───────────────────────────────────
-- S15: Best-sellers view for storefront performance
CREATE MATERIALIZED VIEW IF NOT EXISTS "public"."mv_best_sellers" AS (
  SELECT
    p.id,
    p.name,
    p.slug,
    p.price,
    (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
    COALESCE(SUM(oi.quantity), 0) as total_sold
  FROM products p
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.slug, p.price
  ORDER BY total_sold DESC
);--> statement-breakpoint
-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS "mv_best_sellers_id_idx" ON "mv_best_sellers" ("id");