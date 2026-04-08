FROM node:20-alpine AS builder
RUN apk add --no-cache curl bash && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun
WORKDIR /app

# Copy root manifests
COPY package.json bun.lock ./

# Copy workspace manifests
COPY apps/store/package.json ./apps/store/
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

# Install dependencies (frozen-lockfile equivalent for bun is default if lockfile present)
RUN bun install

# Copy source and build
COPY . .

ARG NEXT_PUBLIC_API_URL=https://api.60sec.shop/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
# S1 FIX: Calibrate memory for Next.js build (Infrastructure Limit: 2G)
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN bun run build --filter=store

# 🚀 Production Stage
FROM oven/bun:1.1.34-slim
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN groupadd -g 1001 node-group && \
    useradd -u 1001 -g node-group -s /bin/sh node-user

# Copy standalone build
# Next.js standalone build puts everything in the root of the standalone folder
COPY --from=builder /app/apps/store/.next/standalone ./
COPY --from=builder /app/apps/store/.next/static ./apps/store/.next/static
COPY --from=builder /app/apps/store/public ./apps/store/public

# Secure permissions
RUN chown -R node-user:node-group /app
USER node-user

EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# 🏁 Final Command
CMD ["bun", "apps/store/server.js"]
