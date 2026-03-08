#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# ops/setup-secrets.sh
# Single Source of Truth: .env → Server
#
# يرسل ملف .env المحلي إلى السيرفر ويعيد تشغيل جميع الخدمات
# Usage: bash ops/setup-secrets.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SSH_KEY="ops/keys/apex-deploy"
SSH_PORT="22"
SSH_USER="deploy"
SSH_HOST="34.18.192.25"
REMOTE_DIR="/home/deploy"
LOCAL_ENV=".env"

echo "🔐 [Single Source of Truth] Syncing .env to server..."

# رفع ملف .env إلى السيرفر
scp -i "$SSH_KEY" -P "$SSH_PORT" "$LOCAL_ENV" "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/.env"

echo "✅ .env synced to server."
echo ""
echo "🔄 Restarting all services to pick up new values..."

ssh -i "$SSH_KEY" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" bash << 'REMOTE'
set -euo pipefail
cd /home/deploy

# إزالة مجلد secrets القديم إن وجد
rm -rf ops/secrets/ 2>/dev/null || true

# إعادة تشغيل جميع الخدمات
docker compose -f ops/docker-compose.prod.yml up -d --force-recreate

echo ""
echo "✅ All services restarted with values from .env"
echo ""
docker ps --format 'table {{.Names}}\t{{.Status}}'
REMOTE
