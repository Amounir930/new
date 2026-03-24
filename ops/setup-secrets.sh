#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# ops/setup-secrets.sh
# Single Source of Truth: .env → Server
#
# Usage: DEPLOY_HOST=x DEPLOY_USER=y SSH_KEY_PATH=z bash ops/setup-secrets.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# S1-S15 Infrastructure Guard: Pre-flight environment check
: "${DEPLOY_HOST:?Error: DEPLOY_HOST environment variable is required but uninitialized.}"
: "${DEPLOY_USER:?Error: DEPLOY_USER environment variable is required but uninitialized.}"
: "${SSH_KEY_PATH:?Error: SSH_KEY_PATH environment variable is required but uninitialized.}"

SSH_PORT="22"
REMOTE_DIR="/home/${DEPLOY_USER}"
LOCAL_ENV="ops/.env"

# S2 Validation Phase: Fault-Tolerance
if [ ! -f "$LOCAL_ENV" ]; then
  echo "❌ CRITICAL ERROR (101): $LOCAL_ENV not found! Production sync aborted."
  exit 101
fi

# S1 Security Audit: Content Validation
# We source the .env locally to verify it isn't empty and contains critical secrets
# shellcheck disable=SC1090
source "$LOCAL_ENV"

# Atomic Variable Verification: Ensure critical secrets are populated (not just declared)
: "${POSTGRES_PASSWORD:?Error: POSTGRES_PASSWORD is null or unset in $LOCAL_ENV}"
: "${REDIS_PASSWORD:?Error: REDIS_PASSWORD is null or unset in $LOCAL_ENV}"
: "${JWT_SECRET:?Error: JWT_SECRET is null or unset in $LOCAL_ENV}"
: "${ENCRYPTION_MASTER_KEY:?Error: ENCRYPTION_MASTER_KEY is null or unset in $LOCAL_ENV}"

echo "🔐 [Enterprise Sync] Propagating $LOCAL_ENV to ${DEPLOY_HOST}..."

# Sync verified .env to server
scp -i "$SSH_KEY_PATH" -P "$SSH_PORT" "$LOCAL_ENV" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/.env"

echo "✅ Secret manifest established on remote host."
echo ""
echo "🔄 Rolling production compute Cluster..."

ssh -i "$SSH_KEY_PATH" -p "$SSH_PORT" "${DEPLOY_USER}@${DEPLOY_HOST}" bash << 'REMOTE'
set -euo pipefail
cd /home/deploy

# Atomically synchronize remote source code
git pull origin refactor/single-source-env

# Purge insecure legacy secrets directory
rm -rf ops/secrets/ 2>/dev/null || true

# Execution Phase: Docker Compose atomic restart
docker compose -f ops/docker-compose.prod.yml up -d --force-recreate

echo ""
echo "🚀 GATE AUTHORIZED: All services synchronized with .env"
echo ""
docker ps --format 'table {{.Names}}\t{{.Status}}'
REMOTE
