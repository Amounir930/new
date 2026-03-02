-- Required Custom Functions
CREATE OR REPLACE FUNCTION public.gen_ulid() RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_time bytea;
  v_rnd  bytea;
BEGIN
  -- ULID format (128 bits): 48-bit timestamp + 80-bit randomness
  -- 1,000,000 multiplier for true Microsecond Precision
  v_time := decode(lpad(to_hex(floor(extract(epoch from clock_timestamp()) * 1000000)::bigint), 12, '0'), 'hex');
  v_rnd  := gen_random_bytes(10);
  RETURN (encode(v_time || v_rnd, 'hex'))::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- ELITE: Support manual overrides for audit/migration purposes
  IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at := clock_timestamp();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_tenant_hijacking() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Security Breach: Tenant ID modification is strictly forbidden' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_price_currency() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
IF (NEW.price).currency IS NULL OR (NEW.price).currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Data Integrity Violation: Invalid currency format in price' USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END;
$$;
