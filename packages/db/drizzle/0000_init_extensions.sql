-- 🏗️ Apex v2 — Foundation Extensions & Utilities
-- Standard: Stripe/Shopify Enterprise Database Guidelines

-- 1. CRITICAL EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID generation support
CREATE EXTENSION IF NOT EXISTS "vector" WITH VERSION '0.5.0';        -- AI Semantic Search (pgvector)
CREATE EXTENSION IF NOT EXISTS "postgis" WITH VERSION '3.3.0';       -- Geospatial Calculations
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Trigram indices for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- Search normalization

-- 2. ENTERPRISE ULID GENERATOR
-- Provides lexicographical sortability (prevents B-Tree fragmentation)
-- 48-bit timestamp + 80-bit randomness
CREATE OR REPLACE FUNCTION gen_ulid() RETURNS uuid AS $$
DECLARE
  -- Get timestamp from current_query_start for transaction-level consistency
  timestamp_ms BIGINT = (extract(epoch from now()) * 1000)::bigint;
  -- Random parts
  entropy BYTEA = gen_random_bytes(10);
  -- Hex result string
  ulid_hex TEXT;
BEGIN
  -- Timestamp: 48 bits (12 hex chars)
  -- Entropy: 80 bits (20 hex chars)
  ulid_hex = lpad(to_hex(timestamp_ms), 12, '0') || encode(entropy, 'hex');
  RETURN CAST(ulid_hex AS uuid);
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. FINANCIAL COMPOSITE TYPES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_amount') THEN
        CREATE TYPE money_amount AS (
            amount BIGINT,
            currency CHAR(3)
        );
    END IF;
END $$;
