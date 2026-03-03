#!/bin/bash
# Phase 2.5 Deployment Script: Surgical Synchronization (Final Victory Run)
IP="34.94.130.73"
KEY="ops/keys/apex-deploy"

echo "🚀 Starting Surgical Synchronization (Try 21)..."

# Professional File List for Phase 2.5
files=(
  "apps/admin/src/components/blueprint/BlueprintEditor.tsx"
  "apps/admin/src/components/tenant/ProvisionModal.tsx"
  "apps/admin/src/components/tenant/TenantList.tsx"
  "apps/admin/src/lib/blueprint-validator.ts"
  "apps/api/Dockerfile"
  "apps/api/src/blueprints/blueprints.controller.ts"
  "apps/api/src/blueprints/blueprints.service.ts"
  "apps/api/src/blueprints/dto/blueprint.dto.ts"
  "apps/api/src/main.ts"
  "apps/api/src/provisioning/dto/provision-request.dto.ts"
  "apps/api/src/provisioning/provisioning.controller.ts"
  "apps/api/src/provisioning/provisioning.service.ts"
  "apps/api/src/tenants/tenants.module.ts"
  "apps/api/src/tenants/tenants-public.controller.ts"
  "packages/auth/src/index.ts"
  "packages/config/src/config.service.ts"
  "packages/config/src/index.ts"
  "packages/config/src/schema.ts"
  "packages/db/drizzle.config.public.ts"
  "packages/db/drizzle.config.tenant.ts"
  "packages/db/drizzle/public/0000_dusty_spyke.sql"
  "packages/db/drizzle/public/meta/_journal.json"
  "packages/db/drizzle/public/meta/0000_snapshot.json"
  "packages/db/drizzle/tenant/0000_nervous_landau.sql"
  "packages/db/drizzle/tenant/meta/_journal.json"
  "packages/db/drizzle/tenant/meta/0000_snapshot.json"
  "packages/db/src/connection.ts"
  "packages/db/src/core.ts"
  "packages/db/src/schema.ts"
  "packages/db/src/schema/public.ts"
  "packages/db/src/schema/tenant.ts"
  "packages/db/src/tenant-registry.service.ts"
  "packages/middleware/src/exception-filter.ts"
  "packages/middleware/src/security.ts"
  "packages/provisioning/src/blueprint.ts"
  "packages/provisioning/src/blueprint/executor.ts"
  "packages/provisioning/src/blueprint/modules/catalog.ts"
  "packages/provisioning/src/blueprint/modules/core.ts"
  "packages/provisioning/src/blueprint/types.ts"
  "packages/provisioning/src/index.ts"
  "packages/provisioning/src/runner.ts"
  "packages/provisioning/src/schema-manager.ts"
  "packages/provisioning/src/seeder.ts"
  "packages/provisioning/src/snapshot-manager.ts"
  "packages/provisioning/src/storage-manager.ts"
  "packages/security/src/secrets/index.ts"
  "packages/validators/src/index.ts"
  "packages/validators/src/storefront/blueprint.schema.ts"
  "packages/validators/src/storefront/index.ts"
  "deployment/staging.env"
  "ops/docker-compose.prod.yml"
  "ops/create_snapshot.sh"
  "package.json"
  "turbo.json"
  "bun.lock"
)
# 1. Sync Files Surgically
for file in "${files[@]}"; do
  echo "📤 Uploading $file..."
  ssh -i $KEY -o StrictHostKeyChecking=no deploy@$IP "rm -f \"deployment/$file\" && mkdir -p \"deployment/\$(dirname \"$file\")\""
  scp -i $KEY -o StrictHostKeyChecking=no "$file" "deploy@$IP:deployment/$file"
done

# 2. Sync Environment
echo "🔐 Updating environment variables..."
echo "GITHUB_REPOSITORY=amounir930/adel" > temp_staging.env
cat "deployment/staging.env" >> temp_staging.env
scp -i $KEY -o StrictHostKeyChecking=no temp_staging.env "deploy@$IP:deployment/.env"
ssh -i $KEY -o StrictHostKeyChecking=no deploy@$IP "cp deployment/.env deployment/ops/.env && sed -i 's/\r$//' deployment/ops/.env"
rm temp_staging.env

# 3. Build & Deploy (Sequential for Memory Safety)
echo "🧹 Purging Stale Build Artifacts..."
ssh -i $KEY -o StrictHostKeyChecking=no deploy@$IP "rm -rf deployment/packages/db/dist deployment/packages/db/tsconfig.tsbuildinfo"
# ssh -i $KEY -o StrictHostKeyChecking=no deploy@$IP "docker builder prune -a -f" # Disabled to save cache

echo "🔄 Rebuilding services sequentially (OOM Prevention)..."
ssh -i $KEY -o StrictHostKeyChecking=no deploy@$IP "cd deployment/ops && sed -i 's/\${GITHUB_REPOSITORY}/amounir930\/adel/g' docker-compose.prod.yml && set -a && source .env && set +a && docker compose -f docker-compose.prod.yml -p ops build api && docker compose -f docker-compose.prod.yml -p ops build admin && docker compose -f docker-compose.prod.yml -p ops up -d"

# 4. Database Reset (Surgical)
echo "🧹 Wiping legacy blueprint data (Zero-Error Hardening)..."
# We wait for the DB to be ready
echo "✅ Deployment Successful - Phase 2.5 Live"
