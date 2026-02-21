
FROM oven/bun:alpine

WORKDIR /app

# Copy the server script
COPY ops/auth-portal/server.ts .

# Expose the auth portal port
EXPOSE 8080

# Run the server
CMD ["bun", "run", "server.ts"]
