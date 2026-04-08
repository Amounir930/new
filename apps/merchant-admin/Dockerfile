# 🏗️ Build Stage
FROM oven/bun:1.1.25 AS builder
WORKDIR /app

# Copy root manifests
COPY package.json bun.lock ./

# Copy workspace manifests
COPY apps/merchant-admin/package.json ./apps/merchant-admin/
COPY apps/api/package.json ./apps/api/
COPY packages/audit/package.json ./packages/audit/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/events/package.json ./packages/events/
COPY packages/export/package.json ./packages/export/
COPY packages/middleware/package.json ./packages/middleware/
COPY packages/provisioning/package.json ./packages/provisioning/
COPY packages/validation/package.json ./packages/validation/
COPY packages/security/package.json ./packages/security/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY packages/validators/package.json ./packages/validators/
COPY packages/monitoring/package.json ./packages/monitoring/
COPY packages/media/package.json ./packages/media/

# Install dependencies
RUN bun install

# Copy source and build
COPY . .

ARG NEXT_PUBLIC_API_URL=https://api.60sec.shop/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# S1 FIX: Calibrate memory and suppress problematic source maps for Bun reconciliation
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV GENERATE_SOURCEMAP=false
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build --filter=merchant-admin

# 🚀 Production Stage
FROM oven/bun:1.1.25-slim
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN groupadd -g 1001 node-group && \
    useradd -u 1001 -g node-group -s /bin/sh node-user

# Copy standalone build
COPY --from=builder /app/apps/merchant-admin/.next/standalone ./
COPY --from=builder /app/apps/merchant-admin/.next/static ./apps/merchant-admin/.next/static
COPY --from=builder /app/apps/merchant-admin/public ./apps/merchant-admin/public

# Secure permissions
RUN chown -R node-user:node-group /app
USER node-user

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# 🏁 Final Command
# We must run from the root of the standalone folder to ensure node_modules are resolved
WORKDIR /app
CMD ["bun", "apps/merchant-admin/server.js"]
