#!/bin/bash
# Super-#21 Verification Script
# Run this on the Production/Staging server to verify Blueprints

echo "🚀 Starting Blueprint Verification on Server..."

# 1. Check if API is running
echo "🔍 Checking API Health..."
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000/api/v1/health/liveness)
if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ API is not healthy (HTTP $HTTP_STATUS). Exiting."
  exit 1
fi
echo "✅ API is Healthy."

# 2. Extract Super Admin Token (Simulation or requires manual input? Let's assume we can hit public endpoints or use a known seed/secret if available. 
# Actually, we likely need a token for the admin endpoints. 
# For now, let's verify the Public/Provision endpoint which might not need auth or use a different mechanism?
# Provision endpoint usually requires a valid API Key or is public for this stage?
# Checking provisioning.controller.ts...
# It allows public access? Let's check.

# 3. Create a Custom Blueprint (Requires Super Admin)
# If we can't easily get a token script-wise, we might skip this or ask user for it.
# BUT, we can check the database directly!

echo "🔍 Checking Database for Blueprints..."
sudo docker compose -f ops/docker-compose.prod.yml exec -T db psql -U postgres -d adel -c "SELECT name, is_default, plan FROM onboarding_blueprints ORDER BY created_at DESC LIMIT 5;"

echo "ℹ️  To verify fully, run these commands manually:"
echo ""
echo "1. Create Blueprint:"
echo "curl -X POST http://localhost:3000/api/admin/blueprints \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\":\"Server Test BP\",\"isDefault\":true,\"plan\":\"free\",\"blueprint\":{\"version\":\"1.0\",\"name\":\"Server BP\",\"settings\":{\"site_name\":\"Server Store\"}}}'"
echo ""
echo "2. Provision Tenant (Free Plan):"
echo "curl -X POST http://localhost:3000/api/provision \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"subdomain\":\"server-test-1\",\"adminEmail\":\"admin@server.com\",\"storeName\":\"My Server Store\",\"plan\":\"free\"}'"
echo ""
echo "🚀 Verification Script Complete."
