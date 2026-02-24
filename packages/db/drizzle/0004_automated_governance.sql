CREATE SCHEMA IF NOT EXISTS governance;--> statement-breakpoint
ALTER TABLE "tenants" SET SCHEMA governance;--> statement-breakpoint
ALTER TABLE "onboarding_blueprints" SET SCHEMA governance;--> statement-breakpoint
ALTER TABLE "subscription_plans" SET SCHEMA governance;--> statement-breakpoint
ALTER TABLE "feature_gates" SET SCHEMA governance;--> statement-breakpoint
ALTER TABLE "tenant_quotas" SET SCHEMA governance;--> statement-breakpoint
ALTER TABLE "system_config" SET SCHEMA governance;--> statement-breakpoint
ALTER ROLE apex SET search_path TO governance, public;
