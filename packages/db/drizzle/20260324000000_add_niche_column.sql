DO $$ BEGIN
    CREATE TYPE "public"."niche_type" AS ENUM('retail', 'wellness', 'education', 'services', 'hospitality', 'real_estate', 'creative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "storefront"."products" ADD COLUMN IF NOT EXISTS "niche" "niche_type" DEFAULT 'retail' NOT NULL;
