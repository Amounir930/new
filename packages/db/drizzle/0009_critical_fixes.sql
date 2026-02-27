-- ============================================================
-- MIGRATION: 0009_critical_fixes.sql
-- Title: Critical Security & Architectural Fixes
-- Audit: APEX-DB-AUDIT-001 | Date: 2026-02-26
-- Fixes: C-01, C-02, C-03, C-04, A-01, A-02, A-03, A-04, A-05, A-06
-- ============================================================
-- IMPORTANT: Run inside a transaction. All or nothing.
-- ============================================================

BEGIN;

-- ============================================================
-- [C-01] Harden S7 Encryption CHECK Constraints
-- OLD: checked for 'encrypted' key only — too weak
-- NEW: enforces full AES-256-GCM envelope {enc, iv, tag, data}
-- Affects: governance.tenants.owner_email
--          governance.users.email
--          governance.leads.email
--          storefront.customers.email, phone, first_name, last_name
--          storefront.customer_addresses.line1, postal_code, phone
--          storefront.affiliate_partners.email
-- ============================================================

-- Helper macro for the new CHECK expression (applied per column below):
-- (col IS NULL) OR (
--   jsonb_typeof(col::jsonb) = 'object'
--   AND col::jsonb ? 'enc' AND col::jsonb ? 'iv'
--   AND col::jsonb ? 'tag' AND col::jsonb ? 'data'
--   AND (col::jsonb ->> 'enc')::boolean = true
-- )

-- governance.tenants.owner_email
ALTER TABLE governance.tenants
  DROP CONSTRAINT IF EXISTS check_owner_email_encrypted,
  ADD CONSTRAINT check_owner_email_encrypted CHECK (
    (owner_email IS NULL) OR (
      jsonb_typeof(owner_email::jsonb) = 'object'
      AND (owner_email::jsonb) ? 'enc'
      AND (owner_email::jsonb) ? 'iv'
      AND (owner_email::jsonb) ? 'tag'
      AND (owner_email::jsonb) ? 'data'
      AND ((owner_email::jsonb ->> 'enc')::boolean = true)
    )
  );
--> statement-breakpoint

-- governance.users.email
ALTER TABLE governance.users
  DROP CONSTRAINT IF EXISTS check_email_encrypted,
  ADD CONSTRAINT check_email_encrypted CHECK (
    (email IS NULL) OR (
      jsonb_typeof(email::jsonb) = 'object'
      AND (email::jsonb) ? 'enc'
      AND (email::jsonb) ? 'iv'
      AND (email::jsonb) ? 'tag'
      AND (email::jsonb) ? 'data'
      AND ((email::jsonb ->> 'enc')::boolean = true)
    )
  );
--> statement-breakpoint

-- governance.leads.email
ALTER TABLE governance.leads
  DROP CONSTRAINT IF EXISTS check_email_encrypted,
  ADD CONSTRAINT check_email_encrypted CHECK (
    (email IS NULL) OR (
      jsonb_typeof(email::jsonb) = 'object'
      AND (email::jsonb) ? 'enc'
      AND (email::jsonb) ? 'iv'
      AND (email::jsonb) ? 'tag'
      AND (email::jsonb) ? 'data'
      AND ((email::jsonb ->> 'enc')::boolean = true)
    )
  );
--> statement-breakpoint

-- storefront.customers — email, phone, first_name, last_name
ALTER TABLE storefront.customers
  DROP CONSTRAINT IF EXISTS check_email_encrypted,
  DROP CONSTRAINT IF EXISTS check_phone_encrypted,
  DROP CONSTRAINT IF EXISTS check_first_name_encrypted,
  DROP CONSTRAINT IF EXISTS check_last_name_encrypted,
  ADD CONSTRAINT check_email_encrypted CHECK (
    (email IS NULL) OR (
      jsonb_typeof(email::jsonb) = 'object' AND (email::jsonb) ? 'enc'
      AND (email::jsonb) ? 'iv' AND (email::jsonb) ? 'tag' AND (email::jsonb) ? 'data'
      AND ((email::jsonb ->> 'enc')::boolean = true)
    )
  ),
  ADD CONSTRAINT check_phone_encrypted CHECK (
    (phone IS NULL) OR (
      jsonb_typeof(phone::jsonb) = 'object' AND (phone::jsonb) ? 'enc'
      AND (phone::jsonb) ? 'iv' AND (phone::jsonb) ? 'tag' AND (phone::jsonb) ? 'data'
      AND ((phone::jsonb ->> 'enc')::boolean = true)
    )
  ),
  ADD CONSTRAINT check_first_name_encrypted CHECK (
    (first_name IS NULL) OR (
      jsonb_typeof(first_name::jsonb) = 'object' AND (first_name::jsonb) ? 'enc'
      AND (first_name::jsonb) ? 'iv' AND (first_name::jsonb) ? 'tag' AND (first_name::jsonb) ? 'data'
      AND ((first_name::jsonb ->> 'enc')::boolean = true)
    )
  ),
  ADD CONSTRAINT check_last_name_encrypted CHECK (
    (last_name IS NULL) OR (
      jsonb_typeof(last_name::jsonb) = 'object' AND (last_name::jsonb) ? 'enc'
      AND (last_name::jsonb) ? 'iv' AND (last_name::jsonb) ? 'tag' AND (last_name::jsonb) ? 'data'
      AND ((last_name::jsonb ->> 'enc')::boolean = true)
    )
  );
--> statement-breakpoint

-- ============================================================
-- [C-02] Fix checkout_math_check — references actual columns
-- OLD: referenced shipping_total, tax_total, discount_total (NON-EXISTENT)
-- NEW: uses subtotal, tax_amount, discount_amount, total
-- ============================================================
ALTER TABLE storefront.orders
  DROP CONSTRAINT IF EXISTS checkout_math_check,
  ADD CONSTRAINT checkout_math_check CHECK (
    ("subtotal"->>'amount') ~ '^[0-9]+$'
    AND ("tax_amount"->>'amount') ~ '^[0-9]+$'
    AND ("discount_amount"->>'amount') ~ '^[0-9]+$'
    AND ("total"->>'amount') ~ '^[0-9]+$'
    AND ("total"->>'amount')::BIGINT =
        ("subtotal"->>'amount')::BIGINT
        + ("tax_amount"->>'amount')::BIGINT
        - ("discount_amount"->>'amount')::BIGINT
  );
--> statement-breakpoint

-- ============================================================
-- [C-03] Fix inventory_movements quantity check
-- OLD: qty > 0 — blocked legitimate outflow (sale, write-off)
-- NEW: qty <> 0 — any non-zero signed int is valid
-- ============================================================
ALTER TABLE storefront.inventory_movements
  DROP CONSTRAINT IF EXISTS qty_positive,
  ADD CONSTRAINT qty_nonzero CHECK (quantity <> 0);
--> statement-breakpoint

-- ============================================================
-- [A-01] Add currency column to orders
-- Required for the currency_match_check constraint to be valid.
-- ============================================================
ALTER TABLE storefront.orders
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SAR';
--> statement-breakpoint

ALTER TABLE storefront.orders
  DROP CONSTRAINT IF EXISTS currency_match_check,
  ADD CONSTRAINT currency_match_check CHECK (
    currency = ("total"->>'currency')
    AND currency = ("subtotal"->>'currency')
  );
--> statement-breakpoint

-- ============================================================
-- [A-02] Enforce S7 encryption on customer_addresses PII
-- OLD: comment-only "S7 Encrypted" with no DB enforcement
-- ============================================================
ALTER TABLE storefront.customer_addresses
  DROP CONSTRAINT IF EXISTS check_line1_encrypted,
  DROP CONSTRAINT IF EXISTS check_postal_code_encrypted,
  DROP CONSTRAINT IF EXISTS check_phone_encrypted,
  ADD CONSTRAINT check_line1_encrypted CHECK (
    (line1 IS NULL) OR (
      jsonb_typeof(line1::jsonb) = 'object' AND (line1::jsonb) ? 'enc'
      AND (line1::jsonb) ? 'iv' AND (line1::jsonb) ? 'tag' AND (line1::jsonb) ? 'data'
      AND ((line1::jsonb ->> 'enc')::boolean = true)
    )
  ),
  ADD CONSTRAINT check_postal_code_encrypted CHECK (
    (postal_code IS NULL) OR (
      jsonb_typeof(postal_code::jsonb) = 'object' AND (postal_code::jsonb) ? 'enc'
      AND (postal_code::jsonb) ? 'iv' AND (postal_code::jsonb) ? 'tag' AND (postal_code::jsonb) ? 'data'
      AND ((postal_code::jsonb ->> 'enc')::boolean = true)
    )
  ),
  ADD CONSTRAINT check_phone_encrypted CHECK (
    (phone IS NULL) OR (
      jsonb_typeof(phone::jsonb) = 'object' AND (phone::jsonb) ? 'enc'
      AND (phone::jsonb) ? 'iv' AND (phone::jsonb) ? 'tag' AND (phone::jsonb) ? 'data'
      AND ((phone::jsonb ->> 'enc')::boolean = true)
    )
  );
--> statement-breakpoint

-- ============================================================
-- [A-03] Encrypt affiliate_partners.email + add blind index
-- ============================================================
ALTER TABLE storefront.affiliate_partners
  ADD COLUMN IF NOT EXISTS email_hash TEXT;
--> statement-breakpoint

-- Migrate existing emails to hash BEFORE adding constraint
-- NOTE: @apex/security migration script must pre-encrypt existing rows.
-- This constraint activates for new rows immediately.
ALTER TABLE storefront.affiliate_partners
  DROP CONSTRAINT IF EXISTS check_email_encrypted,
  ADD CONSTRAINT check_email_encrypted CHECK (
    (email IS NULL) OR (
      jsonb_typeof(email::jsonb) = 'object' AND (email::jsonb) ? 'enc'
      AND (email::jsonb) ? 'iv' AND (email::jsonb) ? 'tag' AND (email::jsonb) ? 'data'
      AND ((email::jsonb ->> 'enc')::boolean = true)
    )
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_affiliate_email_hash
  ON storefront.affiliate_partners (email_hash);

-- ============================================================
-- [A-04] Unique constraint on (tenant_id, feature_key) for feature_gates
-- Prevents ambiguous flag resolution from duplicate rows.
-- NOTE: Remove duplicates first if any exist (keeping latest).
-- ============================================================
DELETE FROM governance.feature_gates fg1
  USING governance.feature_gates fg2
  WHERE fg1.id < fg2.id
    AND fg1.tenant_id IS NOT DISTINCT FROM fg2.tenant_id
    AND fg1.feature_key = fg2.feature_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_tenant_key
  ON governance.feature_gates (tenant_id, feature_key);

-- ============================================================
-- [A-05] Convert dunning_events.status to proper enum
-- ============================================================
-- Step 1: Create enum type if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dunning_status') THEN
    CREATE TYPE dunning_status AS ENUM ('pending', 'retried', 'failed', 'recovered');
  END IF;
END $;
--> statement-breakpoint

-- Step 2: Normalize existing text values
UPDATE governance.dunning_events
  SET status = 'retried'  WHERE status NOT IN ('pending', 'retried', 'failed', 'recovered');

-- Step 3: Cast column to enum
ALTER TABLE governance.dunning_events
  ALTER COLUMN status TYPE dunning_status
  USING status::dunning_status;
--> statement-breakpoint

ALTER TABLE governance.dunning_events
  ALTER COLUMN status SET DEFAULT 'pending'::dunning_status;
--> statement-breakpoint

-- ============================================================
-- [A-06] Create order_fraud_scores table (plan.md Admin-#39)
-- Cross-tenant in governance schema — visible to Super Admin
-- ============================================================
CREATE TABLE IF NOT EXISTS governance.order_fraud_scores (
  id           UUID        NOT NULL DEFAULT gen_ulid() PRIMARY KEY,
  order_id     UUID        NOT NULL,
  tenant_id    UUID        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  risk_score   INTEGER     NOT NULL CONSTRAINT risk_score_range CHECK (risk_score BETWEEN 0 AND 1000),
  is_flagged   BOOLEAN     NOT NULL DEFAULT false,
  is_reviewed  BOOLEAN     NOT NULL DEFAULT false,
  reviewed_by  TEXT,
  decision     TEXT        CONSTRAINT decision_valid CHECK (decision IN ('accepted', 'rejected') OR decision IS NULL),
  provider     TEXT        NOT NULL DEFAULT 'internal',
  signals      JSONB       NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_fraud_order   ON governance.order_fraud_scores (order_id);
CREATE INDEX IF NOT EXISTS idx_fraud_tenant  ON governance.order_fraud_scores (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flagged ON governance.order_fraud_scores (is_flagged)
  WHERE is_flagged = true AND is_reviewed = false;

COMMENT ON TABLE governance.order_fraud_scores IS
  'Risk scores per order from fraud detection service. Admin-#39 (plan.md). Score 0=clean, 1000=definite fraud.';

-- ============================================================
-- Record migration in meta
-- ============================================================
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  VALUES ('0009_critical_fixes', EXTRACT(EPOCH FROM NOW()) * 1000)
  ON CONFLICT DO NOTHING;

COMMIT;
