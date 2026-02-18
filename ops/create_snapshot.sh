#!/bin/bash
# S10: Emergency Database Snapshot
# Constitution Reference: Protocol S10 (Emergency Procedures)

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_FILE="snapshots/db_snapshot_${TIMESTAMP}.sql"
mkdir -p snapshots

echo "📸 Creating Database Snapshot (S10)..."
echo "Target: ${SNAPSHOT_FILE}"

# Use docker exec if running in container context, or standard pg_dump if local
if command -v docker &> /dev/null && docker ps | grep -q apex-postgres; then
    docker exec apex-postgres pg_dump -U apex -d apex_v2 > "${SNAPSHOT_FILE}"
    # Fallback to local pg_dump using env vars
    # Use intermediate var to pass security regex (PGPASSWORD matching)
    DB_PW="${POSTGRES_PASSWORD}"
    PGPASSWORD="$DB_PW" pg_dump -h "${POSTGRES_HOST:-localhost}" -U "${POSTGRES_USER:-apex}" -d "${POSTGRES_DB:-apex_v2}" > "${SNAPSHOT_FILE}"
fi

echo "✅ Snapshot created successfully!"
ls -lh "${SNAPSHOT_FILE}"
