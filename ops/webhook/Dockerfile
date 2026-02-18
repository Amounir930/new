
FROM oven/bun:alpine

# Install Docker CLI, Git, SSH
RUN apk add --no-cache docker-cli git openssh-client

# Create app directory
WORKDIR /app/ops/webhook

# We don't COPY . . here because we mount the host volume to /app
# But we can copy the server script just in case, though mount overrides.
# Actually, better to relied on mounted script so updates propagate?
# No, for stability, we should COPY the server script.
# But 'ops/webhook' is inside the repo.
# If we mount /app, then /app/ops/webhook/server.ts exists.

# Expose port
EXPOSE 9000

# Command to run (using the mounted script)
CMD ["bun", "run", "/app/ops/webhook/server.ts"]
