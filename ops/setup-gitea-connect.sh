# ═══════════════════════════════════════════════════════════════
# 🔗 Connect Local Repo to Gitea via HTTPS (Guaranteed Access)
# ═══════════════════════════════════════════════════════════════

GITEA_URL="https://git.60sec.shop/60sec.shop/apex-v2.git"

echo "🛡️  Configuring Gitea Remote (HTTPS)..."

# Remove complex SSH config if it exists
git config --unset core.sshCommand 2>/dev/null

# Add/Update Remote
if git remote | grep -q "gitea"; then
    echo "🔄 Updating existing remote 'gitea'..."
    git remote set-url gitea "$GITEA_URL"
else
    echo "➕ Adding remote 'gitea'..."
    git remote add gitea "$GITEA_URL"
fi

echo "✅ Configuration Updated to HTTPS."
echo "🚀 Try running: git push gitea main"
echo "🔑 NOTE: You will be asked for your Gitea Username (60sec.shop) and Password."
