# ═══════════════════════════════════════════════════════════════
# 🏗️ Build Stage
# ═══════════════════════════════════════════════════════════════
FROM oven/bun:latest AS builder
WORKDIR /app

# 📦 S1: Copy root manifests
COPY package.json bun.lock ./

# 📦 S2: Copy workspace manifests for optimal caching
# This ensures bun install only re-runs if a package.json changes
COPY apps/admin/package.json ./apps/admin/
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

# 🛠️ S3: Install dependencies
RUN bun install --frozen-lockfile

# 🧪 S4: Copy source and build
COPY . .
RUN bun run build

# ═══════════════════════════════════════════════════════════════
# 🚀 Production Stage (Hardened)
# ═══════════════════════════════════════════════════════════════
FROM oven/bun:latest
WORKDIR /app

# S1: Environment
ENV NODE_ENV=production

# S7: Create non-root user (Least Privilege)
RUN groupadd -g 1001 bun-group && \
    useradd -u 1001 -g bun-group -s /bin/sh bun-user

# S4: Copy the entire built application to preserve workspace links
# We copy from builder to ensure all symlinks and dist folders exist
COPY --from=builder /app /app

# S8: Secure permissions
RUN chown -R bun-user:bun-group /app
USER bun-user

EXPOSE 3000

# 🏁 Final Command
CMD ["bun", "run", "apps/api/dist/main.js"]
