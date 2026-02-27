-- Phase 1, 2, 3, 4 & 5 Migration: Infrastructure, Security, Governance, Catalog, Supply Chain & Global Trade

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
-- 2. Define Custom Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_amount') THEN
        CREATE TYPE money_amount AS (amount BIGINT, currency CHAR(3));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actor_type') THEN
        CREATE TYPE "public"."actor_type" AS ENUM('super_admin', 'tenant_admin', 'system');
    END IF;
END $$;
--> statement-breakpoint
-- 3. Vault & Governance Tables
CREATE TABLE IF NOT EXISTS "vault"."archival_vault" (
    "id" uuid PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
    "table_name" text NOT NULL,
    "original_id" text NOT NULL,
    "tenant_id" uuid NOT NULL,
    "deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_by" text NOT NULL,
    "payload" jsonb NOT NULL,
    "tombstone_hash" text NOT NULL
);

-- 4. Catalog Tables (Phase 3)
CREATE TABLE IF NOT EXISTS "storefront"."product_images" (
    "id" uuid PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "product_id" uuid NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "url" text NOT NULL,
    "alt_text" text
);

CREATE TABLE IF NOT EXISTS "storefront"."product_attributes" (
    "id" uuid PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "product_id" uuid NOT NULL,
    "name" text NOT NULL,
    "value" text NOT NULL,
    "group" text,
    "order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "storefront"."entity_metafields" (
    "id" uuid PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "entity_type" text NOT NULL,
    "entity_id" uuid NOT NULL,
    "namespace" text DEFAULT 'global' NOT NULL,
    "key" text NOT NULL,
    "type" text DEFAULT 'string' NOT NULL,
    "value" jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "storefront"."related_products" (
    "id" uuid PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "product_id" uuid NOT NULL,
    "related_product_id" uuid NOT NULL,
    "relation_type" text DEFAULT 'similar' NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "storefront"."product_category_mapping" (
    "id" uuid PRIMARY KEY DEFAULT gen_ulid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "product_id" uuid NOT NULL,
    "category_id" uuid NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL
);

-- 5. Table Enhancements & Conversions
-- Governance
DO $$$ BEGIN ALTER TABLE "governance"."plan_change_history" ALTER COLUMN "from_plan" TYPE "public"."tenant_plan" USING "from_plan"::"public"."tenant_plan", ALTER COLUMN "to_plan" TYPE "public"."tenant_plan" USING "to_plan"::"public"."tenant_plan"; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "governance"."leads" ADD COLUMN IF NOT EXISTS "landing_page_url" text, ADD COLUMN IF NOT EXISTS "utm_source" varchar(100), ADD COLUMN IF NOT EXISTS "utm_medium" varchar(100), ADD COLUMN IF NOT EXISTS "utm_campaign" varchar(100); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "governance"."audit_logs" ADD COLUMN IF NOT EXISTS "actor_type" "public"."actor_type" DEFAULT 'tenant_admin' NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- Supply Chain (Phase 4)
DO $$$ BEGIN ALTER TABLE "storefront"."suppliers" ADD COLUMN IF NOT EXISTS "lead_time_days" integer DEFAULT 7, ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'SAR', ADD COLUMN IF NOT EXISTS "notes" text; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."purchase_orders" ADD COLUMN IF NOT EXISTS "order_number" text, ADD COLUMN IF NOT EXISTS "subtotal" money_amount, ADD COLUMN IF NOT EXISTS "tax_amount" money_amount, ADD COLUMN IF NOT EXISTS "shipping_amount" money_amount, ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'SAR', ADD COLUMN IF NOT EXISTS "notes" text; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- Discounts (Phase 4)
DO $$$ BEGIN ALTER TABLE "storefront"."price_rules" ADD COLUMN IF NOT EXISTS "applies_to" text DEFAULT 'all' NOT NULL, ADD COLUMN IF NOT EXISTS "entitled_ids" jsonb DEFAULT '[]'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- Global Trade (Phase 5)
DO $$$ BEGIN ALTER TABLE "storefront"."commerce_markets" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS "countries" jsonb DEFAULT '[]'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."price_lists" ADD COLUMN IF NOT EXISTS "product_id" uuid, ADD COLUMN IF NOT EXISTS "variant_id" uuid, ADD COLUMN IF NOT EXISTS "price" money_amount, ADD COLUMN IF NOT EXISTS "compare_at_price" money_amount, ADD COLUMN IF NOT EXISTS "min_quantity" integer DEFAULT 1 NOT NULL, ADD COLUMN IF NOT EXISTS "max_quantity" integer; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."currency_rates" ALTER COLUMN "rate" TYPE numeric(12,6); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- 6. Indices & Constraints
-- audit_logs
CREATE INDEX IF NOT EXISTS "idx_audit_created_brin" ON "governance"."audit_logs" USING BRIN ("created_at") WITH (pages_per_range = 32);
--> statement-breakpoint
-- product_images
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_images_product" ON "storefront"."product_images" ("product_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- product_attributes
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_attrs_product" ON "storefront"."product_attributes" ("product_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_attrs_name" ON "storefront"."product_attributes" ("name"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."product_attributes" ADD CONSTRAINT "product_attributes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- entity_metafields
DO $$$ BEGIN CREATE UNIQUE INDEX IF NOT EXISTS "idx_meta_unique" ON "storefront"."entity_metafields" ("tenant_id", "entity_type", "entity_id", "namespace", "key"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_meta_lookup" ON "storefront"."entity_metafields" ("tenant_id", "entity_type", "entity_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_meta_value_gin" ON "storefront"."entity_metafields" USING GIN ("value"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- related_products
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_related_main" ON "storefront"."related_products" ("product_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."related_products" ADD CONSTRAINT "related_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."related_products" ADD CONSTRAINT "related_products_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "storefront"."products"("id") ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- product_category_mapping
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_cat_mapping_product" ON "storefront"."product_category_mapping" ("product_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_cat_mapping_category" ON "storefront"."product_category_mapping" ("category_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."product_category_mapping" ADD CONSTRAINT "product_category_mapping_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "storefront"."products"("id") ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE "storefront"."product_category_mapping" ADD CONSTRAINT "product_category_mapping_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "storefront"."categories"("id") ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- purchase_orders
DO $$$ BEGIN CREATE UNIQUE INDEX IF NOT EXISTS "idx_po_number_unique" ON "storefront"."purchase_orders" ("tenant_id", "order_number"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- commercial
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_price_list_product" ON "storefront"."price_lists" ("product_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN CREATE INDEX IF NOT EXISTS "idx_price_list_variant" ON "storefront"."price_lists" ("variant_id"); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
-- 7. Performance Tuning (Autovacuum)
DO $$$ BEGIN ALTER TABLE storefront.outbox_events SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005,
    autovacuum_vacuum_cost_limit = 1000
); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE storefront.inventory_levels SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005
); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
DO $$$ BEGIN ALTER TABLE storefront.carts SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
); EXCEPTION WHEN OTHERS THEN NULL; END $$;
--> statement-breakpoint
