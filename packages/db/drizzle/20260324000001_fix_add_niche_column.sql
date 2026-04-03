-- Migration: Add niche and attributes columns to all products tables
-- Targets: storefront + all existing tenant schemas

-- 1. Ensure the enum exists globally
DO $$ BEGIN
    CREATE TYPE "public"."niche_type" AS ENUM('retail', 'wellness', 'education', 'services', 'hospitality', 'real_estate', 'creative', 'food', 'digital');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Storefront products (the source of truth schema)
ALTER TABLE "storefront"."products" ADD COLUMN IF NOT EXISTS "niche" "public"."niche_type" DEFAULT 'retail' NOT NULL;
ALTER TABLE "storefront"."products" ADD COLUMN IF NOT EXISTS "attributes" jsonb DEFAULT '{}' NOT NULL;

-- 3. All existing tenant schemas (generated dynamically during provisioning)
DO $$
DECLARE
    sch RECORD;
BEGIN
    FOR sch IN
        SELECT schemaname FROM pg_tables
        WHERE tablename = 'products' AND schemaname LIKE 'tenant_%'
    LOOP
        EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS niche public.niche_type DEFAULT ''retail'' NOT NULL', sch.schemaname);
        EXECUTE format('ALTER TABLE %I.products ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT ''{}'' NOT NULL', sch.schemaname);
    END LOOP;
END $$;
