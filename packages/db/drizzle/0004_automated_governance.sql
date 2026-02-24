CREATE SCHEMA IF NOT EXISTS governance;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tenants" SET SCHEMA governance; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "onboarding_blueprints" SET SCHEMA governance; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subscription_plans" SET SCHEMA governance; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "feature_gates" SET SCHEMA governance; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tenant_quotas" SET SCHEMA governance; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "system_config" SET SCHEMA governance; EXCEPTION WHEN others THEN null; END $$;--> statement-breakpoint
ALTER ROLE apex SET search_path TO governance, public;
