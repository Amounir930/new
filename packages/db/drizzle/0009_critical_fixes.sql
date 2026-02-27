-- ============================================================
-- MIGRATION: 0009_critical_fixes.sql
-- Title: Critical Security & Architectural Fixes
-- Audit: APEX-DB-AUDIT-001 | Date: 2026-02-26
-- ============================================================

-- [C-01] Harden S7 Encryption CHECK Constraints
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

-- [C-02] Fix checkout_math_check
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

-- [C-03] Fix inventory_movements quantity check
ALTER TABLE storefront.inventory_movements
  DROP CONSTRAINT IF EXISTS qty_positive,
  ADD CONSTRAINT qty_nonzero CHECK (quantity <> 0);
--> statement-breakpoint

-- [A-01] Add currency column to orders
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

-- [A-02] Enforce S7 encryption on customer_addresses PII
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

-- [A-03] Encrypt affiliate_partners.email + add blind index
ALTER TABLE storefront.affiliate_partners
  ADD COLUMN IF NOT EXISTS email_hash TEXT;
--> statement-breakpoint

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
--> statement-breakpoint

-- [A-04] Unique constraint on (tenant_id, feature_key) for feature_gates
DELETE FROM governance.feature_gates fg1
  USING governance.feature_gates fg2
  WHERE fg1.id < fg2.id
    AND fg1.tenant_id IS NOT DISTINCT FROM fg2.tenant_id
    AND fg1.feature_key = fg2.feature_key;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_tenant_key
  ON governance.feature_gates (tenant_id, feature_key);
--> statement-breakpoint

-- [A-05] Convert dunning_events.status to proper enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dunning_status') THEN
    CREATE TYPE dunning_status AS ENUM ('pending', 'retried', 'failed', 'recovered');
  END IF;
END $$;
--> statement-breakpoint

-- Step 2: Normalize existing text values
UPDATE governance.dunning_events
  SET status = 'retried'  WHERE status NOT IN ('pending', 'retried', 'failed', 'recovered');
--> statement-breakpoint

-- Step 3: Cast column to enum
ALTER TABLE governance.dunning_events
  ALTER COLUMN status TYPE dunning_status
  USING status::dunning_status;
--> statement-breakpoint

ALTER TABLE governance.dunning_events
  ALTER COLUMN status SET DEFAULT 'pending'::dunning_status;
--> statement-breakpoint

-- [A-06] Create order_fraud_scores table
CREATE TABLE IF NOT EXISTS governance.order_fraud_scores (
  id           UUID        NOT NULL DEFAULT public.gen_ulid() PRIMARY KEY,
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
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_fraud_order   ON governance.order_fraud_scores (order_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_fraud_tenant  ON governance.order_fraud_scores (tenant_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_fraud_flagged ON governance.order_fraud_scores (is_flagged)
  WHERE is_flagged = true AND is_reviewed = false;
--> statement-breakpoint

DO $$ BEGIN RAISE NOTICE 'Critical Fixes Complete.'; END $$;
--> statement-breakpoint