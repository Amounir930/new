#!/bin/bash
# Quick Fix Deployment: Middleware Exception Filter
IP="34.94.130.73"
KEY="ops/keys/apex-deploy"

echo "⚡ Starting Rapid Middleware Fix..."

# 1. Upload ONLY the changed file & missing dependencies
echo "1. Uploading exception-filter.ts & config files..."
scp -i $KEY -o StrictHostKeyChecking=no "packages/middleware/src/exception-filter.ts" "deploy@$IP:deployment/packages/middleware/src/exception-filter.ts"
scp -i $KEY -o StrictHostKeyChecking=no "packages/config/src/index.ts" "deploy@$IP:deployment/packages/config/src/index.ts"
scp -i $KEY -o StrictHostKeyChecking=no "packages/config/src/schema.ts" "deploy@$IP:deployment/packages/config/src/schema.ts"
scp -i $KEY -o StrictHostKeyChecking=no "packages/config/src/config.service.ts" "deploy@$IP:deployment/packages/config/src/config.service.ts"

# 2. Rebuild Middleware & API ONLY
echo "2. Rebuilding Middleware & API..."
ssh -i $KEY -o StrictHostKeyChecking=no deploy@$IP "
  export PATH=\$PATH:/response/.bun/bin
  cd deployment
  
  # Rebuild Middleware
  echo 'Building @apex/middleware...'
  cd packages/middleware
  # We assume node_modules exists, using tsc directly from previous installs or npx
  ../node_modules/.bin/tsc -p tsconfig.json --outDir ./dist --declaration --declarationMap --sourceMap
  
  # Rebuild API Container
  echo 'Building API Container...'
  cd ../../ops
  docker compose -f docker-compose.prod.yml -p ops build api
  docker compose -f docker-compose.prod.yml -p ops up -d api backend
"

echo "✅ Rapid Deployment Complete"
