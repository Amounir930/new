#!/bin/sh
# ═══════════════════════════════════════════════════════════════
#  Apex V2 — Database Initialization Script
#  Single Source of Truth: packages/db/drizzle/
# ═══════════════════════════════════════════════════════════════
#
#  WHAT THIS DOES:
#    Applies all SQL migration files from packages/db/drizzle/
#    to the apex-postgres container in strict order.
#    It is IDEMPOTENT — safe to run multiple times.
#
#  WHEN TO RUN:
#    ✅ First deployment on a new server
#    ✅ After adding new migration files to drizzle/
#    ❌ Never run on a database with existing data you want to keep
#       (the migrations are additive, but verify first)
#
#  HOW TO RUN (from /opt/apex-v2):
#    chmod +x ops/scripts/init-db.sh
#    ./ops/scripts/init-db.sh
#
# ═══════════════════════════════════════════════════════════════

set -e

# ── Config ────────────────────────────────────────────────────
POSTGRES_CONTAINER="apex-postgres"
POSTGRES_USER="apex"
POSTGRES_DB="apex_v2"
DRIZZLE_DIR="packages/db/drizzle"

# Migration files in exact order (0000 is intentionally excluded)
MIGRATIONS="
0001_baseline.sql
0002_security_hardening.sql
0003_definitive_hardening.sql
0004_phase1_infrastructure.sql
0005_commerce_completion.sql
0006_financial_and_data_integrity.sql
0007_isolation_and_security_hardening.sql
0008_infrastructure_and_performance_tuning.sql
0009_critical_fixes.sql
0010_public_schema_isolation.sql
0011_definitive_security_batch.sql
"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Apex V2 — Database Initialization"
echo "  Source:  $DRIZZLE_DIR"
echo "  Target:  $POSTGRES_CONTAINER → $POSTGRES_DB"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Wait for Postgres ─────────────────────────────────
echo "► [1/3] Waiting for $POSTGRES_CONTAINER to be healthy..."
until docker inspect "$POSTGRES_CONTAINER" --format '{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; do
  sleep 2
  printf "."
done
echo ""
echo "✅ $POSTGRES_CONTAINER is healthy."
echo ""

# ── Step 2: Create migration tracking table ───────────────────
echo "► [2/3] Ensuring migration tracking table exists..."
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
  CREATE TABLE IF NOT EXISTS public.apex_migrations (
    id          SERIAL PRIMARY KEY,
    filename    TEXT NOT NULL UNIQUE,
    applied_at  TIMESTAMPTZ DEFAULT now() NOT NULL
  );
" > /dev/null
echo "✅ Tracking table ready."
echo ""

# ── Step 3: Apply each migration ─────────────────────────────
echo "► [3/3] Applying migrations..."
echo ""

for FILENAME in $MIGRATIONS; do
  FILENAME=$(echo "$FILENAME" | xargs) # trim whitespace
  [ -z "$FILENAME" ] && continue

  FILEPATH="$DRIZZLE_DIR/$FILENAME"

  # Check if file exists locally
  if [ ! -f "$FILEPATH" ]; then
    echo "  ⚠️  SKIP  $FILENAME (file not found, skipping)"
    continue
  fi

  # Check if already applied
  APPLIED=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "SELECT COUNT(*) FROM public.apex_migrations WHERE filename = '$FILENAME';" 2>/dev/null || echo "0")

  if [ "$APPLIED" -gt "0" ]; then
    echo "  ⏭️  SKIP  $FILENAME (already applied)"
    continue
  fi

  echo "  ⏳ APPLY $FILENAME ..."

  # Copy SQL file into container and execute
  docker cp "$FILEPATH" "$POSTGRES_CONTAINER:/tmp/$FILENAME"
  docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -f "/tmp/$FILENAME" --set ON_ERROR_STOP=1 > /dev/null

  # Record as applied
  docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
    "INSERT INTO public.apex_migrations (filename) VALUES ('$FILENAME') ON CONFLICT DO NOTHING;" > /dev/null

  echo "  ✅ DONE  $FILENAME"
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ All migrations applied successfully."
echo "═══════════════════════════════════════════════════════════"
echo ""
