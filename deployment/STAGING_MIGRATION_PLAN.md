# Staging Deployment Plan: Separated Migrations

## Prerequisites
- ✅ Separated schema files created (`public.ts`, `tenant.ts`)
- ✅ Drizzle configs created (`drizzle.config.public.ts`, `drizzle.config.tenant.ts`)
- ✅ Migrations generated (3 public tables, 41 tenant tables)
- ✅ Migration runner updated to use `drizzle/tenant`
- ✅ Local build verified

## ⚠️ CRITICAL: One-Time Database Reset Required

The Staging database currently has **mixed table structure** (public + tenant tables mixed together from old monolithic migrations). We must perform a **ONE-TIME RESET** to clean this up.

### Reset Procedure

```bash
# 1. Run the reset script
cd C:\Users\Dell\Desktop\60sec.shop
bash scripts/reset-staging-db.sh
```

This will:
1. Drop all `tenant_*` schemas (from previous failed provision attempts)
2. Drop all public tables (including the problematic `audit_logs`)
3. Leave a clean slate for new migrations

### Deployment Steps

After database reset:

```bash
# 1. Sync new code to Staging
scp -i ops/keys/apex-deploy -r packages/db/src/schema deploy@34.102.121.225:/opt/apex-v2/packages/db/src/
scp -i ops/keys/apex-deploy -r packages/db/drizzle deploy@34.102.121.225:/opt/apex-v2/packages/db/
scp -i ops/keys/apex-deploy packages/provisioning/src/runner.ts deploy@34.102.121.225:/opt/apex-v2/packages/provisioning/src/

# 2. Copy files into container
ssh -i ops/keys/apex-deploy deploy@34.102.121.225 "
  docker cp /opt/apex-v2/packages/db/src/schema ops-api-1:/app/packages/db/src/ &&
  docker cp /opt/apex-v2/packages/db/drizzle ops-api-1:/app/packages/db/ &&
  docker cp /opt/apex-v2/packages/provisioning/src/runner.ts ops-api-1:/app/packages/provisioning/src/
"

# 3. Rebuild packages inside container
ssh -i ops/keys/apex-deploy deploy@34.102.121.225 "
  docker exec ops-api-1 rm -rf /app/packages/db/dist /app/packages/provisioning/dist &&
  docker exec ops-api-1 bash -c 'cd /app/packages/db && bun run build' &&
  docker exec ops-api-1 bash -c 'cd /app/packages/provisioning && bun run build' &&
  docker exec ops-api-1 bun run build
"

# 4. Restart API (will run initializeS4 for public tables)
ssh -i ops/keys/apex-deploy deploy@34.102.121.225 "docker restart ops-api-1"

# 5. Wait for startup and run diagnostic
sleep 15
ssh -i ops/keys/apex-deploy deploy@34.102.121.225 "docker exec ops-api-1 bun run /tmp/diag-staging.ts"
```

### Expected Results

✅ **Blueprint Creation**: Status 201 Created  
✅ **Tenant Provisioning**: Status 201 Created (NO MORE 500 errors!)

### Verification Queries

After successful deployment, verify table distribution:

```sql
-- Should return ONLY public tables (3 tables)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('audit_logs', 'tenants', 'onboarding_blueprints');

-- Should return NO tenant tables in public
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'stores', 'settings', 'pages');

-- After provisioning, check tenant schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema LIKE 'tenant_%' 
ORDER BY table_schema, table_name;
```

## Rollback Plan

If anything goes wrong:

```bash
# 1. Restore from backup (if available)
# 2. Revert to old code
# 3. Re-run old migrations
```

## Post-Deployment

- [ ] Verify diagnostic script shows 201 for both endpoints
- [ ] Check Staging logs for any errors
- [ ] Provision a test tenant and verify database structure
- [ ] Update documentation
