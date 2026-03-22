# Remote-First Development Guide (Thin Client Model)

This guide documents how to maintain a high-performance development environment on an external server while keeping your local machine as a thin client.

## 📋 Prerequisites
- **Local Machine**: VS Code with "Remote - SSH" extension.
- **Remote Server**: Docker, Docker Compose, and Bun installed.

## 📋 Connection Metadata
- **Remote IP**: `34.18.192.25`
- **SSH User**: `deploy`
- **Identity Key**: `C:\Users\Dell\Desktop\60sec.shop\ops\keys\apex-deploy`
- **Root Directory**: `/opt/apex-v2`

## 🚀 Step 1: Initialize Remote Infrastructure
1. SSH into the server:
   ```bash
   ssh -i "C:\Users\Dell\Desktop\60sec.shop\ops\keys\apex-deploy" deploy@34.18.192.25
   ```
2. Navigate to the project: `cd /opt/apex-v2`
3. Start the development stack (Automated `bun install` + HMR):
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   *Note: On first run, the containers will install dependencies automatically before starting.*

## 🛠️ Step 2: VS Code Remote Configuration
1. Open VS Code on your local machine.
2. Press `F1` -> `Remote-SSH: Connect to Host...` -> Enter server details.
3. Open the repository folder on the remote server.

## 🔌 Step 3: Secure Port Forwarding
VS Code will automatically forward the following ports based on our `.vscode/settings.json`:
- **API (NestJS)**: `3000` -> `localhost:3000`
- **Storefront (Next.js)**: `3002` -> `localhost:3002`
- **MinIO API**: `9000` -> `localhost:9000`
- **MinIO Console**: `9001` -> `localhost:9001`

*(Manually add them in the "Ports" tab if they don't appear automatically).*

## ⚡ Workflow: Zero-Build Rapid Iteration
- **Edit**: Modify any file in `/apps` or `/packages` via VS Code.
- **Sync**: Docker Bind Mounts (`delegated`) sync the change to the container instantly.
- **HMR**: `bun run dev` (Turbo) detects the change and hot-reloads the service in < 1s.
- **Verify**: Open `localhost:3002` on your local browser.

## ⚠️ Troubleshooting
- **Node Modules**: If you see missing dependency errors, run `docker exec -it apex-api-dev bun install` in the remote terminal.
- **CPU/RAM**: All compute tax is paid by the remote server. If the local UI is laggy, ensure your SSH connection is stable.
