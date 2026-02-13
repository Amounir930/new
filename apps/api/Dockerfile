# ═══════════════════════════════════════════════════════════════
# 🏗️ Build Stage
# ═══════════════════════════════════════════════════════════════
FROM oven/bun:latest AS builder
WORKDIR /app

# 📦 S1: Copy package manifests for layer caching
# This ensures bun install only runs if dependencies change
COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/api/package.json ./apps/api/

# 🛠️ S2: Install dependencies (leveraging cache)
RUN bun install --frozen-lockfile

# 🧪 S3: Build the application
COPY . .
RUN bun run build

# ═══════════════════════════════════════════════════════════════
# 🚀 Production Stage
# ═══════════════════════════════════════════════════════════════
FROM oven/bun:latest
WORKDIR /app

# 🛡️ S7: Create non-root user for security (Least Privilege)
RUN groupadd -g 1001 bun-group && \
    useradd -u 1001 -g bun-group -s /bin/sh bun-user

# 📂 S4: Copy only necessary artifacts (Artifact-Driven Deployment)
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

# 🔒 S8: Set permissions
RUN chown -R bun-user:bun-group /app
USER bun-user

EXPOSE 3000

# 🏁 Final Command
CMD ["bun", "run", "apps/api/dist/main.js"]
