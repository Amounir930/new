#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PRODUCTION EMERGENCY REMEDIATION SCRIPT
# Incident: S4 Audit Persistence & Tenant Discovery Failure
# Date: 2026-04-08
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/5] Starting Production Remediation...${NC}"

# Get database connection from environment
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-apex_v2}"
DB_USER="${POSTGRES_USER:-apex}"
export PGPASSWORD="${POSTGRES_PASSWORD}"

echo -e "${YELLOW}[2/5] Checking audit_logs partition status...${NC}"

# Check if April 2026 partition exists
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
-- Check existing partitions
SELECT 
    schemaname,
    tablename,
    pg_get_expr(c.relpartbound, c.oid) as partition_range
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_inherits i ON c.oid = i.inhrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname LIKE 'audit_logs_2026_%'
ORDER BY c.relname;

-- Check if DEFAULT partition exists
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'governance' 
  AND tablename = 'audit_logs_default';
SQL

echo -e "${YELLOW}[3/5] Checking tenant status...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
-- Check system tenant exists
SELECT id, subdomain, status, created_at 
FROM governance.tenants 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Check all active tenants
SELECT id, subdomain, status, created_at 
FROM governance.tenants 
WHERE status = 'active'
ORDER BY created_at DESC;

-- Count of active tenants
SELECT COUNT(*) as active_tenant_count
FROM governance.tenants
WHERE status = 'active';
SQL

echo -e "${YELLOW}[4/5] Verifying audit_logs table structure...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'governance'
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'audit_logs';

-- Check WORM trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_audit_logs_worm';
SQL

echo -e "${YELLOW}[5/5] Checking pg_partman configuration...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
-- Check if pg_partman extension is installed
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'pg_partman';

-- Check partition config if pg_partman exists
SELECT 
    parent_table,
    partition_interval,
    partition_type,
    premake,
    retention,
    retention_keep_table
FROM partman.part_config
WHERE parent_table = 'governance.audit_logs';
SQL

echo -e "${GREEN}Diagnostic complete. Review output above.${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. If partitions are missing, run: psql -f packages/db/drizzle/20260407000001_audit_logs_partitions.sql"
echo "2. If system tenant is missing, insert it with UUID: 00000000-0000-0000-0000-000000000000"
echo "3. If tenants are inactive, update their status in governance.tenants"
echo "4. Verify SENTRY_DSN/GLITCHTIP_DSN is set in your .env file"
echo ""
echo -e "${RED}IMPORTANT: If partitions don't exist, the INSERT will fail until they're created${NC}"
