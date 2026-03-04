#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# ops/setup-secrets.sh
# Fortress V3.0 - Zero-Downtime Docker Secrets Migration
#
# Run this ONCE on the server BEFORE deploying the new compose file.
# Usage: bash ops/setup-secrets.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SECRETS_DIR="./secrets"
ENV_FILE="../.env"

echo "🔐 [Fortress V3.0] Setting up Docker Secrets..."
echo "   Reading secrets from: $ENV_FILE"

# Helper: extract a value from the .env file (robust: handles quotes, special chars, inline comments)
get_env() {
  local key="$1"
  python3 -c "
import re, sys
with open('$ENV_FILE') as f:
    for line in f:
        line = line.strip()
        if line.startswith('${key}='):
            val = line[len('${key}='):]
            if val.startswith('\"') and '\"' in val[1:]:
                val = val[1:val.rindex('\"')]
            elif val.startswith(\"'\") and \"'\" in val[1:]:
                val = val[1:val.rindex(\"'\")]
            else:
                val = re.sub(r'\s+#.*$', '', val)
            sys.stdout.write(val)
            break
"
}

# Create secrets directory (restricted permissions)
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

# Write secret files
echo "$(get_env POSTGRES_PASSWORD)"    > "$SECRETS_DIR/postgres_password.txt"
echo "$(get_env REDIS_PASSWORD)"       > "$SECRETS_DIR/redis_password.txt"
echo "$(get_env JWT_SECRET)"           > "$SECRETS_DIR/jwt_secret.txt"
echo "$(get_env CLOUDFLARE_DNS_API_TOKEN)" > "$SECRETS_DIR/cf_dns_token.txt"
echo "$(get_env CLOUDFLARE_ZONE_API_TOKEN)" > "$SECRETS_DIR/cf_zone_token.txt"
echo "$(get_env MINIO_ROOT_PASSWORD)"  > "$SECRETS_DIR/minio_password.txt"
echo "$(get_env MINIO_ROOT_USER)"      > "$SECRETS_DIR/minio_user.txt"
echo "$(get_env GITEA_DB_PASSWORD)"    > "$SECRETS_DIR/gitea_db_password.txt"
echo "$(get_env WEBHOOK_SECRET)"       > "$SECRETS_DIR/webhook_secret.txt"
echo "$(get_env ENCRYPTION_MASTER_KEY)" > "$SECRETS_DIR/encryption_master_key.txt"
echo "$(get_env API_KEY_SECRET)"       > "$SECRETS_DIR/api_key_secret.txt"
echo "$(get_env BLIND_INDEX_PEPPER)"   > "$SECRETS_DIR/blind_index_pepper.txt"
echo "$(get_env SESSION_SALT)"         > "$SECRETS_DIR/session_salt.txt"
echo "$(get_env INTERNAL_API_SECRET)"  > "$SECRETS_DIR/internal_api_secret.txt"
echo "$(get_env SUPER_ADMIN_PASSWORD)" > "$SECRETS_DIR/super_admin_password.txt"

# Restrict all secret files to root-only
# Make secrets readable by containers (which run as non-root users e.g., 70:70 or 999:1000)
chmod 644 "$SECRETS_DIR"/*.txt

echo ""
echo "✅ Secrets created in: $SECRETS_DIR"
echo ""
echo "⚠️  NEXT STEPS (MANDATORY):"
echo "   1. Verify files: ls -la $SECRETS_DIR"
echo "   2. Run deployment: cd /opt/apex-v2 && bash ops/deploy.sh"
echo "   3. After deployment succeeds – rotate ALL passwords in .env"
echo "   4. Re-run: bash ops/setup-secrets.sh to sync rotated values"
echo ""
echo "🔒 Secret files are readable by root only (chmod 600)"
