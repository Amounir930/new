-- S4 Protocol: Manual Audit Log Partition Creation
-- Use this if pg_partman maintenance falls behind.
-- Target: governance.audit_logs

-- April 2026 (Already started)
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m04 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');

-- May 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m05 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

-- June 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m06 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

-- July 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m07 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

-- August 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m08 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

-- September 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m09 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- October 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m10 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- November 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m11 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

-- December 2026
CREATE TABLE IF NOT EXISTS governance.audit_logs_y2026m12 PARTITION OF governance.audit_logs
FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Ensure proper ownership and permissions (S7 Compliance)
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'governance' AND tablename LIKE 'audit_logs_%'
    LOOP
        EXECUTE format('ALTER TABLE governance.%I OWNER TO postgres', r.tablename);
        EXECUTE format('GRANT SELECT, INSERT ON TABLE governance.%I TO apex_api', r.tablename);
    END LOOP;
END $$;
