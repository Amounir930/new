-- Find all missing columns in tenant products tables vs storefront schema
SELECT s.schemaname, c.column_name
FROM (
  SELECT schemaname FROM pg_tables
  WHERE tablename = 'products'
) s
CROSS JOIN (
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'products' AND table_schema = 'storefront'
) c
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns ic
  WHERE ic.table_schema = s.schemaname
    AND ic.table_name = 'products'
    AND ic.column_name = c.column_name
)
ORDER BY s.schemaname, c.column_name;
