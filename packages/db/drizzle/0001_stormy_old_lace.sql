CREATE TABLE IF NOT EXISTS "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '',
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"plan_code" varchar(50),
	"feature_key" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"default_max_products" integer DEFAULT 50,
	"default_max_orders" integer DEFAULT 100,
	"default_max_pages" integer DEFAULT 5,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subscription_plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"max_products" integer,
	"max_orders" integer,
	"max_pages" integer,
	"storage_limit_gb" integer DEFAULT 1,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "users" DROP CONSTRAINT "users_email_unique"; EXCEPTION WHEN undefined_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "audit_logs" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING "metadata"::jsonb; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET NOT NULL; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_hash" text NOT NULL DEFAULT '';--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "feature_gates" ADD CONSTRAINT "feature_gates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tenant_quotas" ADD CONSTRAINT "tenant_quotas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_email_hash_unique" UNIQUE("email_hash"); EXCEPTION WHEN duplicate_object THEN null; END $$;