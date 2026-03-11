-- Migration: Central Identity Management (governance.users)
-- Implementation following SQL-First Sovereign Mandate

-- Ensure governance schema exists (though it should already exist from initial.sql)
CREATE SCHEMA IF NOT EXISTS "governance";

-- Create "users" table in "governance" schema
CREATE TABLE IF NOT EXISTS "governance"."users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "email" jsonb NOT NULL,
  "email_hash" text NOT NULL,
  "password_hash" text NOT NULL,
  "roles" text[] NOT NULL DEFAULT '{merchant}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "users_email_hash_unique" UNIQUE ("email_hash"),
  -- S7 Encryption Protocol Check
  CONSTRAINT "chk_user_email_s7" CHECK (
    (jsonb_typeof(email) = 'object'::text) AND 
    (email ? 'enc'::text) AND 
    (email ? 'iv'::text) AND 
    (email ? 'tag'::text) AND 
    (email ? 'data'::text)
  ),
  -- Bcrypt format check: $2[ayb]$...
  CONSTRAINT "chk_user_pwd_hash" CHECK (password_hash ~ '^\$2[ayb]\$.+$'::text)
);

-- Index for fast lookup by email hash
CREATE INDEX IF NOT EXISTS "idx_users_email_hash" ON "governance"."users" ("email_hash");

-- Comment for documentation
COMMENT ON TABLE "governance"."users" IS 'Central identity management for staff and merchants (Cross-tenant access control)';
