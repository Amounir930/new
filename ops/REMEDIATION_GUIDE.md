# PRODUCTION INCIDENT REMEDIATION GUIDE
## S4 Audit Persistence & Tenant Discovery Failure
**Date:** 2026-04-08  
**Severity:** CRITICAL - System Lockout  
**Status:** Ready for Deployment

---

## 🔍 FORENSIC ANALYSIS SUMMARY

### Issues Identified:
1. ✅ **UUID Syntax Error** - Already fixed in code (`SYSTEM_TENANT_ID` properly defined)
2. ⚠️ **Missing Database Partitions** - Migration exists but may not be applied
3. ⚠️ **Tenant Discovery Failure** - System tenant or active tenants missing/inactive
4. ⚠️ **Sentry/GlitchTip DSN** - Environment variable not configured

---

## 🚀 IMMEDIATE ACTION PLAN

### Step 1: Run Diagnostic Script
```bash
# SSH into production server
cd /opt/apex-v2
chmod +x ops/emergency_remediation.sh
./ops/emergency_remediation.sh
```

This will output the current state of:
- Audit log partitions
- Active tenants
- System tenant status
- Database permissions

### Step 2: Apply Emergency Fix
```bash
# Review the SQL first!
cat ops/emergency_fix.sql

# Apply to production database
psql -h <prod-db-host> -U <db-user> -d <db-name> -f ops/emergency_fix.sql
```

### Step 3: Set Environment Variables
Add to your production `.env` or docker-compose environment:
```bash
# Error Tracking (GlitchTip/Sentry)
GLITCHTIP_DSN=https://your-dsn@glitchtip.example.com/1
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@glitchtip.example.com/1
```

### Step 4: Restart Services
```bash
# From docker-compose directory
docker-compose -f ops/docker-compose.prod.yml restart apex-api
docker-compose -f ops/docker-compose.prod.yml restart apex-cron

# Or graceful restart
docker-compose -f ops/docker-compose.prod.yml up -d --no-deps apex-api
```

### Step 5: Verify Fix
```bash
# Check API health
curl -f http://localhost:3000/api/v1/health/liveness

# Check logs for errors
docker logs --tail 100 apex-api | grep -i "audit\|error\|fatal"

# Verify tenant discovery
docker exec -it apex-api sh -c "curl -s http://localhost:3000/api/v1/health/readiness"
```

---

## 📋 MANUAL DATABASE FIX (If Scripts Fail)

### 1. Create Missing Partition
```sql
-- Connect to production database
psql -h <host> -U <user> -d <database>

-- Create April 2026 partition
CREATE TABLE IF NOT EXISTS governance.audit_logs_2026_04 
    PARTITION OF governance.audit_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- Create DEFAULT partition (safety net)
CREATE TABLE IF NOT EXISTS governance.audit_logs_default 
    PARTITION OF governance.audit_logs DEFAULT;
```

### 2. Fix System Tenant
```sql
-- Insert system tenant if missing
INSERT INTO governance.tenants (
    id, subdomain, name, status, tier, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system',
    'System Tenant',
    'active',
    'internal',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET status = 'active';
```

### 3. Activate Tenants (If All Inactive)
```sql
-- Check tenant status
SELECT id, subdomain, status FROM governance.tenants;

-- Activate specific tenant (replace with actual subdomain)
UPDATE governance.tenants 
SET status = 'active', updated_at = NOW()
WHERE subdomain = 'your-tenant-subdomain';
```

### 4. Verify Partman Maintenance
```sql
-- If pg_partman is installed
SELECT public.run_maintenance();

-- Check partition config
SELECT * FROM partman.part_config 
WHERE parent_table = 'governance.audit_logs';
```

---

## 🔒 SECURITY NOTES

1. **RLS Policies**: Audit logs have Row Level Security enabled. Ensure the service account has:
   ```sql
   GRANT INSERT ON governance.audit_logs TO apex_service;
   GRANT SELECT ON governance.audit_logs TO apex_service;
   ```

2. **WORM Compliance**: The `trg_audit_logs_worm` trigger prevents updates/deletes. This is intentional for S4 compliance.

3. **Partition Strategy**: The DEFAULT partition catches any rows outside defined ranges, preventing insert failures.

---

## 📊 MONITORING POST-FIX

### Watch for These Patterns:
```bash
# Successful audit logs
docker logs -f apex-api | grep "audit" | grep "SUCCESS"

# Partition errors (should NOT appear after fix)
docker logs -f apex-api | grep "no partition"

# Tenant discovery (should show active tenants)
docker logs -f apex-api | grep "active tenants"
```

### Cron Job Verification:
```bash
# Check orphan cleanup ran successfully
docker logs apex-api | grep "ORPHAN_CLEANUP"
# Expected: "Processed X tenants" (not "No active tenants")
```

---

## 🎯 ROOT CAUSE ANALYSIS

### What Happened:
1. Database migration for partitions was not deployed to production
2. System tenant was either missing or marked inactive
3. No DEFAULT partition existed as safety net
4. GlitchTip DSN not configured, hiding deeper errors

### Why Authentication Failed:
- Audit logging is **mandatory** in the security protocol
- When partition insert fails → Audit service throws error
- Auth flow requires audit log → Circular dependency → Total lockout

### Why Cron Failed:
- `getActiveTenants()` queries `governance.tenants WHERE status = 'active'`
- If system tenant is missing/inactive → Empty result → "No active tenants"

---

## ✅ VERIFICATION CHECKLIST

After applying fixes:

- [ ] April 2026 partition exists
- [ ] DEFAULT partition exists
- [ ] System tenant is active
- [ ] At least one tenant has `status = 'active'`
- [ ] API health endpoint returns 200
- [ ] No audit persistence errors in logs
- [ ] Cron jobs report processing tenants
- [ ] GLITCHTIP_DSN environment variable set
- [ ] User login works (test with non-admin account)
- [ ] Subdomain routing works (test tenant subdomain)

---

## 📞 ESCALATION

If issues persist after applying fixes:

1. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'audit_logs';
   ```

2. **Check Database Permissions**:
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_schema = 'governance' 
     AND table_name = 'audit_logs';
   ```

3. **Connection Pool Issues**:
   - Verify `adminPool` has correct credentials
   - Check `pg_stat_activity` for stuck connections
   - Restart connection pooler (PgBouncer if used)

4. **Emergency Bypass** (LAST RESORT):
   ```typescript
   // In audit.service.ts - TEMPORARY ONLY
   async log(entry: AuditLogEntry): Promise<void> {
     try {
       await this.persistLog(/*...*/);
     } catch (error) {
       this.logger.error('Audit log failed, continuing...', error);
       // DO NOT THROW - allows system to function
     }
   }
   ```
   ⚠️ **WARNING**: This violates S4 compliance. Remove immediately after stabilization.

---

## 📝 POST-MORTEM ACTION ITEMS

- [ ] Setup automated partition provisioning via pg_partman cron
- [ ] Add health check for partition existence
- [ ] Alert on tenant count = 0
- [ ] Document GLITCHTIP_DSN setup in deployment guide
- [ ] Add integration test for audit log insertion
- [ ] Create runbook for partition maintenance

---

**Files Created:**
- `ops/emergency_remediation.sh` - Diagnostic script
- `ops/emergency_fix.sql` - Automated fix script
- `ops/REMEDIATION_GUIDE.md` - This document

**Next Steps:** Review scripts, apply to staging first (if possible), then production.
