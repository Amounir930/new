#!/bin/bash
set -euo pipefail
# Apex v2 - Deployment Script (Hardened)
# Usage: DEPLOY_SERVER_IP=x.x.x.x DEPLOY_SSH_USER=apex ./scripts/deploy.sh

# ═══════════════════════════════════════════════════════════════
# MANDATORY Environment Variables (no defaults for security)
# ═══════════════════════════════════════════════════════════════
if [ -z "${DEPLOY_SERVER_IP:-}" ]; then
    echo "❌ DEPLOY_SERVER_IP is required (no hardcoded defaults)"
    exit 1
fi
if [ -z "${DEPLOY_SSH_USER:-}" ]; then
    echo "❌ DEPLOY_SSH_USER is required"
    exit 1
fi

SERVER_IP="$DEPLOY_SERVER_IP"
SSH_USER="$DEPLOY_SSH_USER"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519_apex}"
TARGET_DIR="/opt/apex-v2"

# ═══════════════════════════════════════════════════════════════
# Pre-flight Security Checks
# ═══════════════════════════════════════════════════════════════
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH Key not found at $SSH_KEY"
    exit 1
fi

# Enforce strict key permissions (owner read-only)
chmod 600 "$SSH_KEY"

# Verify known_hosts (NEVER skip host key verification)
if ! ssh-keygen -F "$SERVER_IP" > /dev/null 2>&1; then
    echo "❌ Server $SERVER_IP not found in known_hosts."
    echo "   Run: ssh-keyscan $SERVER_IP >> ~/.ssh/known_hosts"
    echo "   Then verify the fingerprint before proceeding."
    exit 1
fi

SSH_OPTS="-i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=10"

echo "🚀 Deploying Apex v2 to $SSH_USER@$SERVER_IP..."

# 1. Create remote directory
echo "📂 Creating directory..."
ssh $SSH_OPTS $SSH_USER@$SERVER_IP "sudo mkdir -p $TARGET_DIR && sudo chown $SSH_USER:$SSH_USER $TARGET_DIR"

# 2. Upload Files (NO .env files shipped)
echo "📦 Uploading project files..."
scp $SSH_OPTS -r \
  package.json \
  turbo.json \
  biome.json \
  docker-compose.yml \
  apps \
  packages \
  docker \
  scripts \
  $SSH_USER@$SERVER_IP:$TARGET_DIR

# 3. Environment: .env must be pre-configured on server (NEVER auto-generate)
echo "🔧 Verifying remote .env exists..."
ssh $SSH_OPTS $SSH_USER@$SERVER_IP "test -f $TARGET_DIR/.env" || {
    echo "❌ Remote .env not found. Manually configure $TARGET_DIR/.env on the server."
    exit 1
}

# 4. Execute Setup
echo "⚙️ Running server setup..."
ssh $SSH_OPTS $SSH_USER@$SERVER_IP "chmod +x $TARGET_DIR/scripts/server-setup.sh && sudo $TARGET_DIR/scripts/server-setup.sh"

# 5. Start Infrastructure
echo "🐳 Starting Docker containers..."
ssh $SSH_OPTS $SSH_USER@$SERVER_IP "cd $TARGET_DIR && sudo docker compose up -d"

# 6. Post-deploy Health Check
echo "🏥 Running health check..."
sleep 10
HEALTH=$(ssh $SSH_OPTS $SSH_USER@$SERVER_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/health" || echo "000")
if [ "$HEALTH" != "200" ]; then
    echo "⚠️ WARNING: Health check returned $HEALTH (expected 200)"
else
    echo "✅ Health check passed"
fi

echo "✅ Deployment Complete!"
