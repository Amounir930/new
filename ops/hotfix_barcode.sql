DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT table_schema
    FROM information_schema.tables
    WHERE table_name = 'products' AND table_schema LIKE 'tenant_%'
  LOOP
    EXECUTE format('ALTER TABLE %I.products DROP CONSTRAINT IF EXISTS chk_barcode_format', r.table_schema);
    EXECUTE format(
      'ALTER TABLE %I.products ADD CONSTRAINT chk_barcode_format CHECK ((barcode IS NULL) OR (barcode ~ ''^[A-Za-z0-9-]{8,50}$''))',
      r.table_schema
    );
    RAISE NOTICE 'Fixed schema: %', r.table_schema;
  END LOOP;
END;
$$;
