#!/bin/bash
# Apex v2 - Deployment Script
# Usage: ./scripts/deploy.sh

# Configuration
# Configuration
SERVER_IP="${DEPLOY_SERVER_IP:-136.111.146.88}" # Default or override from env
SSH_USER="${DEPLOY_SSH_USER:-apex-v2-dev}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519_apex}"

# Ensure SSH Key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH Key not found at $SSH_KEY"
    echo "   Please set DEPLOY_SSH_KEY environment variable."
    exit 1
fi
TARGET_DIR="/opt/apex-v2"

echo "🚀 Deploying Apex v2 to $SSH_USER@$SERVER_IP..."

# 1. Create remote directory
echo "📂 Creating directory..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "sudo mkdir -p $TARGET_DIR && sudo chown $SSH_USER:$SSH_USER $TARGET_DIR"

# 2. Upload Files
echo "📦 Uploading project files..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r \
  package.json \
  turbo.json \
  biome.json \
  docker-compose.yml \
  .env.example \
  apps \
  packages \
  docker \
  scripts \
  $SSH_USER@$SERVER_IP:$TARGET_DIR

# 3. Rename .env.example to .env (if not exists)
echo "🔧 Configuring environment..."
ssh -i "$SSH_KEY" $SSH_USER@$SERVER_IP "cp -n $TARGET_DIR/.env.example $TARGET_DIR/.env || true"

# 4. Execute Setup
echo "⚙️ Running server setup..."
ssh -i "$SSH_KEY" $SSH_USER@$SERVER_IP "chmod +x $TARGET_DIR/scripts/server-setup.sh && sudo $TARGET_DIR/scripts/server-setup.sh"

# 5. Start Infrastructure
echo "🐳 Starting Docker containers..."
ssh -i "$SSH_KEY" $SSH_USER@$SERVER_IP "cd $TARGET_DIR && sudo docker compose up -d"

echo "✅ Deployment Complete!"
echo "🌍 Server IP: http://$SERVER_IP"
