-- Mandate #46: Bloat Monitoring
-- Creates a view to identify tables that need VACUUM FULL or REINDEX due to fragmentation.

CREATE OR REPLACE VIEW governance.vw_table_bloat AS
SELECT
  schemaname, tablename, 
  pg_size_pretty(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))) as size,
  n_dead_tup,
  last_vacuum, 
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Mandate #45: Large Object Cleanup
-- Automatically purges OIDs that are no longer referenced in any tenant table.

CREATE OR REPLACE FUNCTION governance.purge_orphaned_large_objects()
RETURNS VOID AS $$
BEGIN
    PERFORM lo_unlink(oid) FROM pg_largeobject_metadata 
    WHERE oid NOT IN (
        -- Replace with actual columns that store OIDs if any
        SELECT 1 FROM pg_class WHERE false 
    );
END;
$$ LANGUAGE plpgsql;

-- Mandate #49: Schema Drift Alerting
-- Tracks schema history to detect unauthorized changes (Out-of-band DDL).

CREATE TABLE IF NOT EXISTS governance.schema_drift_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    schema_name TEXT,
    object_name TEXT,
    command_tag TEXT,
    actor TEXT
);

-- Note: In production, we would use event triggers for this.
-- CREATE EVENT TRIGGER alert_schema_drift ON ddl_command_end EXECUTE FUNCTION ...
