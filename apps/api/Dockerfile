# ═══════════════════════════════════════════════════════════════
# 🏗️ Build Stage
# ═══════════════════════════════════════════════════════════════
FROM oven/bun:1.1.18 AS builder
WORKDIR /app

# 📦 S1: Copy root manifests
COPY package.json bun.lock ./

# 📦 S2: Copy workspace manifests for optimal caching
# This ensures bun install only re-runs if a package.json changes
COPY apps/merchant-admin/package.json ./apps/merchant-admin/
COPY apps/super-admin/package.json ./apps/super-admin/
COPY apps/api/package.json ./apps/api/
COPY packages/audit/package.json ./packages/audit/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/events/package.json ./packages/events/
COPY packages/export/package.json ./packages/export/
COPY packages/middleware/package.json ./packages/middleware/
COPY packages/provisioning/package.json ./packages/provisioning/
COPY packages/security/package.json ./packages/security/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY packages/validators/package.json ./packages/validators/
COPY packages/monitoring/package.json ./packages/monitoring/
COPY packages/media/package.json ./packages/media/

# 🛠️ S3: Install dependencies
RUN bun install

# 🧪 S4: Copy source and build
COPY . .
# S1 FIX: Calibrate memory for build (Infrastructure Limit: 2G)
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV SKIP_ENV_VALIDATION="true"
RUN bun run build --filter=@apex/api

# ═══════════════════════════════════════════════════════════════
# 🚀 Production Stage (Hardened)
# ═══════════════════════════════════════════════════════════════
FROM oven/bun:1.1.18
# S1: Environment
ENV NODE_ENV=production

# S7: Create non-root user (Least Privilege)
RUN apt-get update && apt-get install -y curl && \
    curl -sSf https://atlasgo.sh | sh && \
    groupadd -g 1001 bun-group && \
    useradd -u 1001 -g bun-group -s /bin/sh bun-user

# S4: Copy the entire built application to preserve workspace links
# We copy from builder to ensure all symlinks and dist folders exist
COPY --from=builder /app /app

# Ensure migrations are explicitly available in the expected path
# Although /app is copied, we ensure the structure used by the runner is intact
# The runner expects /app/packages/db/drizzle/tenant

WORKDIR /app/apps/api

# S8: Secure permissions
RUN chown -R bun-user:bun-group /app
USER bun-user

EXPOSE 3000

# 🏁 Final Command
# Use shell form to allow find to execute
CMD ["/bin/sh", "-c", "bun $(find dist -name main.js | head -n 1)"]
