-- 🛡️ V6 FATAL AUDIT - NATIVE TIMESTAMP ENFORCEMENT (MANDATE #6)
-- Prevent application-layer manipulation of `updated_at` by compromised APIs.

-- 1. Create the global set_updated_at function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CLOCK_TIMESTAMP();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger to ALL storefront tables that have an `updated_at` column
DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'storefront' 
          AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON storefront.%I;', tbl.table_name);
        EXECUTE format(
            'CREATE TRIGGER trg_set_updated_at 
             BEFORE UPDATE ON storefront.%I 
             FOR EACH ROW 
             EXECUTE FUNCTION set_updated_at();',
            tbl.table_name
        );
    END LOOP;
END $$;
