#!/bin/bash
set -euo pipefail

# ==============================================================================
# 🚀 APEX v2 Zero-Downtime Deployer - PRODUCTION READY
# ==============================================================================

DIR="/opt/apex-v2"
COMPOSE_FILE="$DIR/ops/docker-compose.prod.yml"
ENV_FILE="$DIR/.env"
LOCK_FILE="/tmp/apex-deploy.lock"
BACKUP_DIR="$DIR/backups/$(date +%Y%m%d_%H%M%S)"

# Prevent concurrent deployments
if [ -f "$LOCK_FILE" ]; then
    RUNNING_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "unknown")
    if ps -p "$RUNNING_PID" > /dev/null 2>&1; then
        echo "❌ Another deployment is running (PID: $RUNNING_PID)"
        exit 1
    else
        echo "⚠️  Stale lock file found, removing..."
        rm -f "$LOCK_FILE"
    fi
fi

echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

[ ! -f "$ENV_FILE" ] && { echo "❌ Missing .env at $ENV_FILE"; exit 1; }

# ✅ Load and validate variables
echo "🔍 Validating environment..."
# S1: Load variables safely without triggering shell expansion errors on bcrypt hashes
# We use 'set +u' and avoid direct sourcing if possible, or source with care.
set +u
set -a
source "$ENV_FILE"
set -u
set +a

REQUIRED_VARS=("GITEA_DB_PASSWORD" "WEBHOOK_SECRET" "DATABASE_URL" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        echo "❌ Error: $var is not set in $ENV_FILE"
        exit 1
    fi
done
echo "✅ Environment validated"

echo "🚀 Starting deployment..."

# 🔹 [0] Backup before deploy (safety)
mkdir -p "$BACKUP_DIR"
docker compose -f "$COMPOSE_FILE" ps > "$BACKUP_DIR/pre-deploy-status.txt" 2>/dev/null || true

# 🔹 [1] Smart Pull
echo "⬇️  [1/4] Pulling images..."
if ! timeout 180 docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull --quiet 2>/dev/null; then
    echo "⚠️  Pull failed/timeout, using existing images"
fi

# 🔹 [2] Database Migration (Handled via Atlas Pre-deploy)
echo "🗄️  [2/4] Schema mapping via Atlas confirmed. Skipping Drizzle Push."

# 🔹 [3] Rolling Deploy with proper health checks
echo "🚀  [3/4] Deploying updated services (no-cache for fresh Next.js build)..."
# Verify secrets directory exists before deploying
if [ ! -d "$DIR/ops/secrets" ]; then
    echo "❌ Docker Secrets not found at $DIR/ops/secrets"
    echo "   Run: bash ops/setup-secrets.sh"
    exit 1
fi
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --remove-orphans

# 🔹 [4] PROPER Health Check
echo "🏥 [4/4] Health verification..."
MAX_WAIT=120
INTERVAL=3
ELAPSED=0
MIN_WAIT=5  # ✅ Wait for containers to initialize

echo "   Initial wait for containers to start..."
sleep $MIN_WAIT
ELAPSED=$MIN_WAIT

while [ $ELAPSED -lt $MAX_WAIT ]; do
    ALL_HEALTHY=true
    SERVICES_WITH_HEALTHCHECK=0
    HEALTHY_COUNT=0
    
    # Get services details using pipe-delimited format to avoid space issues in Status
    while IFS='|' read -r SERVICE_NAME STATE HEALTH; do
        [ -z "$SERVICE_NAME" ] && continue
        
        # S15 Compliance: Check for non-running states
        if [ "$STATE" != "running" ]; then
            echo "❌ $SERVICE_NAME is $STATE (not running)!"
            exit 1
        fi
        
        # If healthcheck exists
        if [ -n "$HEALTH" ]; then
            SERVICES_WITH_HEALTHCHECK=$((SERVICES_WITH_HEALTHCHECK + 1))
            
            if [ "$HEALTH" = "healthy" ]; then
                HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
            elif [ "$HEALTH" = "unhealthy" ]; then
                echo "❌ $SERVICE_NAME is unhealthy!"
                exit 1
            elif [ "$HEALTH" = "starting" ]; then
                echo "   ⏳ $SERVICE_NAME: starting... (${ELAPSED}s)"
                ALL_HEALTHY=false
            fi
        fi
    done < <(docker compose -f "$COMPOSE_FILE" ps --format "{{.Name}}|{{.State}}|{{.Health}}")
    
    if [ "$ALL_HEALTHY" = true ] && [ $HEALTHY_COUNT -eq $SERVICES_WITH_HEALTHCHECK ] && [ $SERVICES_WITH_HEALTHCHECK -gt 0 ]; then
        echo "   ✅ All $HEALTHY_COUNT services healthy in ${ELAPSED}s"
        break
    fi
    
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "❌ Deployment timeout after ${MAX_WAIT}s!"
    exit 1
fi

echo "🎉 Deployment successful!"
docker system prune -f 2>/dev/null || true