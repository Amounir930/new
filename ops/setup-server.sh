#!/bin/bash
set -e

# ==============================================================================
# 🚀 APEX v2 Server Bootstrapper
# ==============================================================================
# Usage: ./setup-server.sh
# Supported OS: Ubuntu 22.04 LTS / Debian 12
# ==============================================================================

echo "🔹 [1/5] Updating System..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git unzip jq ufw fail2ban

echo "🔹 [2/5] Hardening Firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw --force enable
echo "✅ Firewall active."

echo "🔹 [3/5] Installing Docker Connection..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    echo "✅ Docker installed."
else
    echo "✅ Docker already installed."
fi

echo "🔹 [4/5] Creating Directory Structure..."
mkdir -p /opt/apex-v2/{ops,backups,logs}
mkdir -p /opt/apex-v2/letsencrypt
chmod -R 750 /opt/apex-v2

echo "🔹 [5/5] Configuring Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban

echo "🎉 Server Setup Complete!"
echo "👉 Next Step: Copy your .env.production to /opt/apex-v2/.env"
echo "👉 Then run: ./deploy.sh"
