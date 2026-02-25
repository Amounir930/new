-- Mandate #14: Audit Log Immortality (Hardened with EVENT TRIGGER)
-- Prevokes TRUNCATE on audit logs to prevent erasing trails even with superuser access.

CREATE OR REPLACE FUNCTION governance.block_audit_truncate_event()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.command_tag IN ('TRUNCATE') AND obj.object_identity ~ 'audit_logs' THEN
            RAISE EXCEPTION 'Fatal Violation: TRUNCATE on % is strictly forbidden by Policy #14.', obj.object_identity
                USING ERRCODE = 'P0002';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Deploy Event Trigger (Requires Superuser)
CREATE EVENT TRIGGER trg_audit_immutable_event ON ddl_command_end 
WHEN TAG IN ('TRUNCATE') 
EXECUTE FUNCTION governance.block_audit_truncate_event();
