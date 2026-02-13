#!/bin/bash
set -e

# ==============================================================================
# 🚀 APEX v2 Zero-Downtime Deployer
# ==============================================================================

DIR="/opt/apex-v2"
COMPOSE_FILE="$DIR/ops/docker-compose.prod.yml"
ENV_FILE="$DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Missing .env file at $ENV_FILE"
    exit 1
fi

echo "🔹 [1/4] Pulling latest images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "🔹 [2/4] Running Database Migrations..."
# Run migration in a temporary container
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm api bun run db:migrate

echo "🔹 [3/4] Rolling Update (Zero Downtime)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo "🔹 [4/4] Verifying Health..."
sleep 10
if docker compose -f "$COMPOSE_FILE" ps | grep "unhealthy"; then
    echo "❌ Deployment Failed: Unealthy services detected."
    exit 1
fi

echo "🎉 Deployment Successful!"
docker system prune -f # Cleanup old images
