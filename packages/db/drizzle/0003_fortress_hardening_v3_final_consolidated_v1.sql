CREATE TYPE "public"."blueprint_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'cod', 'wallet', 'bnpl');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "tenant_migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"migration_name" text NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"row_number" integer NOT NULL,
	"row_data" jsonb,
	"error_message" text NOT NULL,
	"error_type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
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
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "onboarding_blueprints" ALTER COLUMN "plan" SET DATA TYPE tenant_plan;--> statement-breakpoint
ALTER TABLE "onboarding_blueprints" ALTER COLUMN "status" SET DATA TYPE blueprint_status;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plan" SET DATA TYPE tenant_plan;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "status" SET DATA TYPE tenant_status;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "is_published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE order_status;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DATA TYPE payment_status;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE payment_method;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "meta_title" varchar(60);--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "meta_description" varchar(160);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "tenant_migrations" ADD CONSTRAINT "tenant_migrations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_job_id_import_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_migrations_tenant_idx" ON "tenant_migrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_banners_active" ON "banners" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_banners_priority" ON "banners" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_newsletter_email" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_import_errors_job" ON "import_errors" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_import_jobs_tenant" ON "import_jobs" USING btree ("tenant_id","created_at");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pages_slug" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_pages_published" ON "pages" USING btree ("is_published");--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_slug_unique" UNIQUE("slug");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_best_sellers" AS (
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
CREATE POLICY "tenants_isolation" ON "tenants" AS PERMISSIVE FOR SELECT TO public USING (status = 'active');