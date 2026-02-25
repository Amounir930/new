#!/bin/bash
# 🛡️ Audit 444: Hardened Database Snapshot
# Issues: 6 (Permissions), 22 (Retention), 29 (Verification)

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_FILE="snapshots/db_snapshot_${TIMESTAMP}.dump"
mkdir -p snapshots

# Issue 6: Strict Permissions
chmod 700 snapshots

echo "📸 Creating Hardened Database Snapshot (Custom Format)..."

# Issue 29: Use -Fc for custom format to support pg_restore verification
if command -v docker &> /dev/null && docker ps | grep -q apex-postgres; then
    docker exec apex-postgres pg_dump -U apex -d apex_v2 -Fc > "${SNAPSHOT_FILE}"
else
    DB_PW="${POSTGRES_PASSWORD}"
    PGPASSWORD="$DB_PW" pg_dump -h "${POSTGRES_HOST:-localhost}" -U "${POSTGRES_USER:-apex}" -d "${POSTGRES_DB:-apex_v2}" -Fc > "${SNAPSHOT_FILE}"
fi

# Issue 29: Integrity Verification
echo "🔍 Verifying Snapshot Integrity..."
pg_restore --list "${SNAPSHOT_FILE}" > /dev/null
echo "✅ Integrity Verified."

# Issue 22: Retention Policy (Delete backups older than 30 days)
echo "🧹 Applying Retention Policy (30 Days)..."
find snapshots -name "db_snapshot_*.dump*" -mtime +30 -delete

# Gap #4: Hash Verification Loop
echo "🔐 Generating SHA-256 Checksum..."
sha256sum "${SNAPSHOT_FILE}" > "${SNAPSHOT_FILE}.sha256"

echo "🛡️ Verifying Backup Integrity..."
sha256sum -c "${SNAPSHOT_FILE}.sha256"

echo "🚀 Hardened Snapshot complete: ${SNAPSHOT_FILE}"
ls -lh "${SNAPSHOT_FILE}"*
