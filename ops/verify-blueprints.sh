#!/bin/bash
# Super-#21 Verification Script
# Run this on the Production/Staging server to verify Blueprints

echo "🚀 Starting Blueprint Verification on Server..."

# 1. Check if API is running (Retry up to 12 times = 60s)
echo "🔍 Checking API Health..."
MAX_RETRIES=12
count=0
HTTP_STATUS="000"

while [ $count -lt $MAX_RETRIES ]; do
  # S21 Fix: Access via Traefik (localhost:80) with Host header + HTTPS redirect handling? 
  # Actually Traefik redirects 80->443. simple curl to localhost:80 might get 301.
  # Let's try skipping cert check on https localhost:443 or just check the 301/200.
  # Better: Exec into container for "Liveness", check Traefik for "Integration".
  
  # Method A: Docker Exec (Internal Health)
  # HTTP_STATUS=$(sudo docker exec ops-api-1 curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health/liveness)
  
  # Method B: Traefik (Integration) - Use insecure HTTPS to localhost
  HTTP_STATUS=$(curl -k -o /dev/null -s -w "%{http_code}" -H "Host: staging.60sec.shop" https://localhost/api/v1/health/liveness)
  
  if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ API is Healthy (via Traefik)."
    break
  fi
  echo "⏳ Waiting for API... (Attempt $((count+1))/$MAX_RETRIES - Status: $HTTP_STATUS)"
  sleep 5
  count=$((count+1))
done

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ API failed to start after 60s (HTTP $HTTP_STATUS). Exiting."
  # Optional: Print logs
  sudo docker logs --tail 20 ops-api-1
  exit 1
fi

# ...


# 3. Verify Blueprint Endpoint exists (Super-#21 Feature Check)
echo "🔍 Checking API Endpoint /api/admin/blueprints..."
# We expect 403 Forbidden (because we have no token), NOT 404 Not Found.
# 404 would mean the controller is NOT mounted (feature missing).
BLUEPRINT_STATUS=$(curl -k -o /dev/null -s -w "%{http_code}" -H "Host: staging.60sec.shop" https://localhost/api/admin/blueprints)

if [ "$BLUEPRINT_STATUS" == "403" ]; then
  echo "✅ Endpoint /api/admin/blueprints exists (Got 403 Forbidden as expected)."
  echo "🚀 Feature 'Onboarding Blueprint Editor' is DEPLOYED."
elif [ "$BLUEPRINT_STATUS" == "200" ]; then
    echo "✅ Endpoint /api/admin/blueprints is OPEN (Got 200 OK)."
else
  echo "⚠️  Endpoint returned HTTP $BLUEPRINT_STATUS (Expected 403). check logs."
  # It might be 401?
fi

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
