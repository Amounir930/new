#!/bin/bash
# Apex v2 - Server Provisioning Script (Hardened)
# Compatible with Ubuntu 22.04 LTS
# Run as root (sudo su)

set -euo pipefail

echo "🚀 Starting Apex v2 Server Provisioning (Hardened)..."

# 1. Update System
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl unzip git jq tree fail2ban ufw unattended-upgrades

# 2. Install Docker & Docker Compose
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# 3. Install Bun
echo "🥯 Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo "✅ Bun installed"
else
    echo "✅ Bun already installed"
fi

# 4. Prepare Directories
echo "📁 Creating project directories..."
mkdir -p /opt/apex-v2
chown -R $USER:$USER /opt/apex-v2

# 5. SSH Hardening
echo "🔒 Hardening SSH..."
SSHD_CONFIG="/etc/ssh/sshd_config"
cp "$SSHD_CONFIG" "$SSHD_CONFIG.backup.$(date +%s)"

# Disable root login and password authentication
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSHD_CONFIG"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONFIG"
sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' "$SSHD_CONFIG"
sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/' "$SSHD_CONFIG"
sed -i 's/^#\?LoginGraceTime.*/LoginGraceTime 30/' "$SSHD_CONFIG"
systemctl restart sshd
echo "✅ SSH hardened (root disabled, password auth disabled, max 3 tries)"

# 6. Fail2Ban (Brute-force protection)
echo "🛡️ Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban
echo "✅ Fail2Ban configured (ban after 3 SSH failures for 1 hour)"

# 7. Firewall Setup (UFW) - Strict
echo "🛡️ Configuring Firewall (Strict)..."
ufw default deny incoming
ufw default allow outgoing
ALLOWED_SSH_IP="${ALLOWED_SSH_IP:-any}"
ufw allow from "$ALLOWED_SSH_IP" to any port 22 proto tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
# Port 8080 (Traefik Dashboard) is NOT exposed publicly.
# Access it via SSH tunnel: ssh -L 8080:localhost:8080 user@server
ufw --force enable
echo "✅ Firewall configured (SSH, 80, 443 only - Traefik dashboard internal)"

# 8. Automatic Security Updates
echo "🔄 Enabling automatic security updates..."
dpkg-reconfigure -plow unattended-upgrades 2>/dev/null || true
echo "✅ Automatic security updates enabled"

echo "✅ Server Provisioning Complete!"
echo "➡️  Next Step: Run 'deploy.sh' from your local machine."
echo "⚠️  Remember: Manually configure /opt/apex-v2/.env before deploying."
