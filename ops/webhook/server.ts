
import { serve } from "bun";
import { spawn } from "bun";

const SECRET = process.env.WEBHOOK_SECRET || "ApexDeploySecret2026";
const PORT = 9000;
// We mount the host root to /app
const REPO_DIR = "/app";

console.log(`🛡️  Apex Webhook Listener v1.0 starting on port ${PORT}...`);

serve({
    port: PORT,
    async fetch(req) {
        if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

        // 1. Verify Secret
        // Gitea sends content-type: application/json usually
        // We check query param ?secret=... OR body.secret
        const url = new URL(req.url);
        const querySecret = url.searchParams.get("secret");

        let bodySecret = "";
        try {
            const body = await req.json();
            bodySecret = body.secret;
        } catch (e) {
            // Body might be empty or not json
        }

        if (querySecret !== SECRET && bodySecret !== SECRET) {
            console.error("❌ Unauthorized webhook attempt");
            return new Response("Unauthorized", { status: 401 });
        }

        console.log("🚀 Webhook verified. Triggering surgical deployment...");

        // 2. Execute Deployment Logic
        // We use 'sh' because we are in Alpine
        // origin must point to Gitea. We assume 'gitea' remote exists or we use 'origin'.
        // We set the SSH command to use the mounted deployment key.

        // Gitea Internal URL (Docker Network): ssh://git@gitea:22/60sec.shop/apex-v2.git 
        // Wait, inside docker network, 'gitea' service exposes port 2222 mapped to 22?? 
        // No, docker-compose says: ports: 2222:22. So internal port is 22.
        // Service name is 'gitea'. 
        // So URL: ssh://git@gitea:22/60sec.shop/apex-v2.git

        const GITEA_INTERNAL_URL = "ssh://git@gitea:22/60sec.shop/apex-v2.git";
        const DEPLOY_KEY_PATH = "/app/ops/keys/webhook_deploy_key";

        const script = `
      echo "📂 Navigating to ${REPO_DIR}..."
      cd ${REPO_DIR} || exit 1

      echo "🔧 Configuring Git Safe Directory & SSH..."
      git config --global --add safe.directory ${REPO_DIR}
      export GIT_SSH_COMMAND="ssh -i ${DEPLOY_KEY_PATH} -o StrictHostKeyChecking=no"

      echo "🔗 Setting up Remote..."
      # Ensure 'origin' points to local Gitea or add 'local-gitea' remote
      if ! git remote | grep -q "local-gitea"; then
          git remote add local-gitea ${GITEA_INTERNAL_URL}
      else
          git remote set-url local-gitea ${GITEA_INTERNAL_URL}
      fi

      echo "⬇️ Pulling latest code..."
      # Pull logic
      git fetch local-gitea
      git reset --hard local-gitea/main

      echo "🏗️ Rebuilding Services (Surgical)..."
      # We use the host's docker daemon
      docker compose -f ops/docker-compose.prod.yml up -d --build --no-deps api admin

      echo "🧹 Pruning..."
      docker system prune -f

      echo "✅ Deployment Complete."
    `;

        // Spawn detached process so we don't block response (or block if we want to wait?)
        // Gitea expects quick response. We'll run and log.
        const proc = spawn(["sh", "-c", script], {
            stdout: "inherit",
            stderr: "inherit"
        });

        return new Response("Deployment Triggered 🚀", { status: 200 });
    }
});
