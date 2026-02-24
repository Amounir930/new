-- Super Admin Governance Isolation
-- Create the dedicated governance schema
CREATE SCHEMA IF NOT EXISTS governance;

-- Move global management tables to the governance schema
ALTER TABLE IF EXISTS tenants SET SCHEMA governance;
ALTER TABLE IF EXISTS onboarding_blueprints SET SCHEMA governance;
ALTER TABLE IF EXISTS subscription_plans SET SCHEMA governance;
ALTER TABLE IF EXISTS feature_gates SET SCHEMA governance;
ALTER TABLE IF EXISTS tenant_quotas SET SCHEMA governance;
ALTER TABLE IF EXISTS system_config SET SCHEMA governance;

-- Update search_path for the 'apex' user to include governance by default
-- This ensures that existing queries might still work if they don't use schema qualification
-- BUT we should update the code to be explicit.
ALTER ROLE apex SET search_path TO governance, public;
