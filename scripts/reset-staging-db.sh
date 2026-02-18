#!/bin/bash
# Staging Database Reset Script
# WARNING: This will DELETE ALL DATA in the Staging database
# Use this ONCE to clean up mixed table structure before applying separated migrations

set -e

echo "🚨 WARNING: This will DELETE ALL DATA in the Staging database!"
echo "This is a ONE-TIME operation to clean up legacy mixed tables."
echo ""
read -p "Type 'RESET' to confirm: " confirmation

if [ "$confirmation" != "RESET" ]; then
  echo "❌ Reset cancelled."
  exit 1
fi

echo ""
echo "📋 Staging Database Reset Plan:"
echo "1. Drop all tenant schemas (tenant_*)"
echo "2. Drop public tables (tenants, audit_logs, onboarding_blueprints, etc)"
echo "3. Recreate fresh public schema"
echo "4. Run public migrations (via AuditService.initializeS4)"
echo "5. Ready for tenant provisioning with clean tenant migrations"
echo ""

# Connect to Staging database
ssh -i ops/keys/apex-deploy -o StrictHostKeyChecking=no deploy@34.102.121.225 << 'ENDSSH'

# Drop all tenant schemas
docker exec apex-postgres psql -U apex -d apex_v2 -c "
DO \$\$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%') 
  LOOP
    EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(r.schema_name) || ' CASCADE';
    RAISE NOTICE 'Dropped schema: %', r.schema_name;
  END LOOP;
END \$\$;
"

# Drop public tables
echo "🗑️  Dropping public tables..."
docker exec apex-postgres psql -U apex -d apex_v2 << 'SQL'
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.onboarding_blueprints CASCADE;
DROP TABLE IF EXISTS public.feature_gates CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.tenant_quotas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.__drizzle_migrations CASCADE;
SQL

echo "✅ Database reset complete!"
echo ""
echo "Next steps:"
echo "1. Restart API container (will run AuditService.initializeS4 for public tables)"
echo "2. Deploy new code with separated migrations"
echo "3. Test provisioning with diagnostic script"

ENDSSH

echo ""
echo "🎉 Staging database is now clean and ready for separated migrations!"
