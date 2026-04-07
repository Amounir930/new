-- ==========================================
-- S4 AUDIT PARTITION PROVISIONING
-- Migration: 20260407000001_audit_logs_partitions
-- Purpose: Create monthly partitions for governance.audit_logs (2026-2027) + DEFAULT
-- Compliance: S1-S15 | WORM trigger propagates automatically (PG 11+)
-- ==========================================

-- 2026 Monthly Partitions
CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_01" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_02" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_03" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_04" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_05" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_06" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_07" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_08" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_09" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_10" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_11" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2026_12" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- 2027 Monthly Partitions
CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_01" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_02" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_03" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_04" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_05" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_06" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_07" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_08" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_09" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_10" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_11" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');

CREATE TABLE IF NOT EXISTS "governance"."audit_logs_2027_12" PARTITION OF "governance"."audit_logs"
    FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');

-- DEFAULT Partition (Safety Net)
-- Catches any row with created_at outside the defined monthly ranges.
-- Prevents "no partition found" crashes from clock drift or unprovisioned years.
CREATE TABLE IF NOT EXISTS "governance"."audit_logs_default" PARTITION OF "governance"."audit_logs" DEFAULT;

-- Verify WORM trigger propagation (informational — trigger inherits from parent on PG 11+)
-- The trg_audit_logs_worm trigger on the parent table automatically applies to all child partitions.
-- No per-partition trigger creation is needed or recommended.
