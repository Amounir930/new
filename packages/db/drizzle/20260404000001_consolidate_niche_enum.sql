-- Migration: Consolidate tenant_niche → niche_type enum
-- Purpose: Eliminate dual-enum drift. All platform code must use public.niche_type (9 values).
-- Risk: MEDIUM — alters column type on governance.onboarding_blueprints, drops old enum.
-- Rollback: See DATABASE_FORENSIC_MAP.md rollback plan.
-- Author: Lead DBRE
-- Date: 2026-04-04

-- ──────────────────────────────────────────────────────────────
-- Step 1: Hydrate tenant_niche with missing values from niche_type
-- The original tenant_niche had 7 values (including 'real-estate' with hyphen).
-- niche_type has 9 values (including 'real_estate' with underscore, 'food', 'digital').
-- We must add the missing values BEFORE altering the column type, otherwise PostgreSQL
-- will reject existing rows that contain values not present in the target enum.
-- ──────────────────────────────────────────────────────────────

-- Add 'real_estate' (underscore) if it doesn't exist alongside 'real-estate' (hyphen)
ALTER TYPE public.tenant_niche ADD VALUE IF NOT EXISTS 'real_estate';

-- Add 'food' and 'digital' to match niche_type
ALTER TYPE public.tenant_niche ADD VALUE IF NOT EXISTS 'food';
ALTER TYPE public.tenant_niche ADD VALUE IF NOT EXISTS 'digital';

-- ──────────────────────────────────────────────────────────────
-- Step 2: Rewrite hyphenated 'real-estate' → 'real_estate' in existing blueprint rows
-- The original SQL used 'real-estate' (hyphen), but niche_type uses 'real_estate' (underscore).
-- Any blueprint rows still holding the hyphenated value must be normalized first.
-- ──────────────────────────────────────────────────────────────

UPDATE governance.onboarding_blueprints
SET niche_type = 'real_estate'
WHERE niche_type = 'real-estate';

-- ──────────────────────────────────────────────────────────────
-- Step 3: ALTER COLUMN type from tenant_niche → niche_type
-- Uses explicit text→enum cast via USING clause.
-- This is atomic: either succeeds fully or rolls back entirely.
-- After this, the column is constrained by the 9-value niche_type enum.
--
-- NOTE: Must DROP DEFAULT first because PostgreSQL cannot auto-cast
-- default values between different enum types.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE governance.onboarding_blueprints
  ALTER COLUMN niche_type DROP DEFAULT;

ALTER TABLE governance.onboarding_blueprints
  ALTER COLUMN niche_type TYPE public.niche_type
  USING niche_type::text::public.niche_type;

ALTER TABLE governance.onboarding_blueprints
  ALTER COLUMN niche_type SET DEFAULT 'retail'::public.niche_type;

-- ──────────────────────────────────────────────────────────────
-- Step 4: Drop the obsolete tenant_niche enum
-- Safe only after Step 3 succeeds (no column references it anymore).
-- ──────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS public.tenant_niche;
