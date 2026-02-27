-- Audit 444 Mandate: Block UPDATE/DELETE on audit_logs
-- Statement-breakpoint
CREATE OR REPLACE FUNCTION block_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit Violation (S34): Mutations on audit_logs are forbidden';
END;
$$ LANGUAGE plpgsql;

-- Statement-breakpoint
-- NOTE: audit mutation triggers are applied AFTER partitioned table creation below
-- Mandate #6: Audit Log Range Partitioning
-- Ensures NVMe stability under high-volume write pressure.

-- 1. Create partitioning schema if needed
CREATE SCHEMA IF NOT EXISTS partman;
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;
--> statement-breakpoint
DO $$
BEGIN
    -- Only rename if audit_logs is a regular table (not already partitioned)
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'governance' AND c.relname = 'audit_logs' AND c.relkind = 'r') THEN
        -- Only rename if target doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'governance' AND c.relname = 'audit_logs_baseline') THEN
            ALTER TABLE governance.audit_logs RENAME TO audit_logs_baseline;
        ELSE
            -- Both exist, drop the non-partitioned one
            DROP TABLE governance.audit_logs;
        END IF;
    END IF;

    -- Create partitioned table only if it doesn't exist or is not already partitioned
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'governance' AND c.relname = 'audit_logs' AND c.relkind = 'p') THEN
        CREATE TABLE governance.audit_logs (
            "id" uuid DEFAULT gen_ulid() NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "severity" "audit_severity" DEFAULT 'INFO' NOT NULL,
            "result" "audit_result" DEFAULT 'SUCCESS' NOT NULL,
            "tenant_id" text NOT NULL,
            "user_id" text,
            "user_email" text,
            "action" text NOT NULL,
            "entity_type" text NOT NULL,
            "entity_id" text NOT NULL,
            "ip_address" text,
            "user_agent" text,
            "old_values" jsonb,
            "new_values" jsonb,
            "metadata" jsonb,
            "impersonator_id" text,
            "checksum" text,
            "actor_type" text DEFAULT 'tenant_admin' NOT NULL,
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);
--> statement-breakpoint
-- Migrate baseline data if it exists
        IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'governance' AND c.relname = 'audit_logs_baseline') THEN
            INSERT INTO governance.audit_logs SELECT * FROM governance.audit_logs_baseline;
        END IF;
    END IF;

    -- Hand over to Partman (idempotent, deferred via EXECUTE to avoid pre-parse failures)
    BEGIN
        EXECUTE 'SELECT 1 FROM partman.part_config WHERE parent_table = ''governance.audit_logs''';
    EXCEPTION WHEN undefined_table OR OTHERS THEN
        BEGIN
            PERFORM partman.create_parent(
                'governance.audit_logs',
                'created_at',
                'native',
                'daily',
                p_start_partition := (now() - interval '1 day')::text
            );
--> statement-breakpoint
EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Partman setup skipped: %', SQLERRM;
        END;
    END;

    -- Configure retention (deferred)
    BEGIN
        EXECUTE 'UPDATE partman.part_config SET retention = ''90 days'', retention_keep_table = false WHERE parent_table = ''governance.audit_logs''';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
--> statement-breakpoint
-- Mandate #14: Audit Immutability Triggers (S4/S7)
-- Prevents any modification of logs once written.

CREATE OR REPLACE FUNCTION governance.enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit Violation: Mutations forbidden' USING ERRCODE = 'P0005';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable_update ON governance.audit_logs;
--> statement-breakpoint
CREATE TRIGGER trg_audit_immutable_update
BEFORE UPDATE ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.enforce_audit_immutability();
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_audit_immutable_delete ON governance.audit_logs;
--> statement-breakpoint
CREATE TRIGGER trg_audit_immutable_delete
BEFORE DELETE ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.enforce_audit_immutability();
--> statement-breakpoint
-- Mandate #7: Archival Vault & Cryptographic Tombstones
-- Super Admin Hard Deletions move records to Vault instead of permanent loss.

CREATE OR REPLACE FUNCTION governance.move_to_archival_vault()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- 1. Identify actor (Super Admin context)
    v_user_email := current_setting('app.current_user_email', true);
--> statement-breakpoint
-- 2. Insert into vault
    INSERT INTO vault.archival_vault (
        table_name,
        original_id,
        tenant_id,
        deleted_by,
        payload,
        tombstone_hash
    ) VALUES (
        TG_TABLE_NAME,
        OLD.id::text,
        COALESCE(OLD.tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(v_user_email, 'system'),
        to_jsonb(OLD),
        encode(digest(to_jsonb(OLD)::text, 'sha256'), 'hex') -- Cryptographic Tombstone
    );
--> statement-breakpoint
RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Example: Apply to financial tables (to be expanded in final remediation)
-- CREATE TRIGGER trg_vault_delete_orders
-- BEFORE DELETE ON storefront.orders
-- FOR EACH ROW EXECUTE FUNCTION governance.move_to_archival_vault();
--> statement-breakpoint
-- Mandate #11: Tenant Isolation Bypass Validation
-- Recursive CTE to detect cross-tenant leakage or missing RLS policies.

CREATE OR REPLACE FUNCTION governance.detect_tenant_leaks()
RETURNS TABLE(table_name TEXT, leak_type TEXT, details TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH tenant_tables AS (
        SELECT t.table_name
        FROM information_schema.columns t
        WHERE t.column_name = 'tenant_id'
        AND t.table_schema IN ('governance', 'storefront')
    )
    -- 1. Detect Tables Missing tenant_id (Mandate #1)
    SELECT
        t.table_name::text,
        'MISSING_TENANT_ID'::text,
        'Table in storefront/governance lacks tenant_id column'::text
    FROM information_schema.tables t
    WHERE t.table_schema IN ('governance', 'storefront')
    AND t.table_name NOT IN (SELECT tt.table_name FROM tenant_tables tt)
    AND t.table_type = 'BASE TABLE'
    
    UNION ALL

    -- 2. Detect Tables Missing RLS (Mandate #11)
    SELECT
        t.table_name::text,
        'MISSING_RLS'::text,
        'Row Level Security is not enabled on this table'::text
    FROM information_schema.tables t
    WHERE t.table_schema IN ('governance', 'storefront')
    AND t.table_name NOT IN (SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname IN ('governance', 'storefront') AND relrowsecurity = true)
    AND t.table_type = 'BASE TABLE';
END;
$$ LANGUAGE plpgsql;

-- Mandate #12: Vault Schema Lockdown
-- Strict REVOKE to prevent accidental exposure of DEKs.

DO $$
BEGIN
    -- Revoke public access
    REVOKE ALL ON SCHEMA vault FROM PUBLIC;
    REVOKE ALL ON ALL TABLES IN SCHEMA vault FROM PUBLIC;
    
    -- Create restrictive access function
    -- This would be used by the app_user via SECURITY DEFINER
    EXECUTE 'CREATE OR REPLACE FUNCTION vault.get_tenant_dek(p_tenant_id UUID)
    RETURNS BYTEA SECURITY DEFINER AS $inner$
    DECLARE
        v_key BYTEA;
    BEGIN
        -- Audit the access (Mandate #4/S4)
        INSERT INTO governance.audit_logs (tenant_id, action, metadata)
        VALUES (p_tenant_id, ''DEK_ACCESS'', jsonb_build_object(''timestamp'', now()));
--> statement-breakpoint
SELECT encrypted_key INTO v_key
        FROM vault.encryption_keys
        WHERE tenant_id = p_tenant_id AND is_active = true;
        
        RETURN v_key;
    END;
    $inner$ LANGUAGE plpgsql;';
END;
$$;
-- Mandate #20: Universal Schema Drift Event Triggers
-- Captures all DDL changes for forensic auditing.

CREATE OR REPLACE FUNCTION governance.log_schema_drift()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        INSERT INTO governance.audit_logs (
            tenant_id,
            action,
            metadata
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid, -- System level
            'SCHEMA_DRIFT',
            jsonb_build_object(
                'command_tag', obj.command_tag,
                'object_type', obj.object_type,
                'object_identity', obj.object_identity,
                'timestamp', now()
            )
        );
--> statement-breakpoint
END LOOP;
END;
$$ LANGUAGE plpgsql;

-- EVENT TRIGGER trg_audit_schema_drift deferred to final migration

-- Mandate #18: Global Soft Delete Scoping (Active Views)
-- Mandate #18: Global Soft Delete Scoping (Active Views)
-- These reference the underlying base tables (prefixed with _) since
-- the storefront.products view already filters deleted_at IS NULL.

DO $$ BEGIN
    -- Only create if the underlying table exists
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'storefront' AND c.relname = '_products') THEN
        BEGIN
            CREATE OR REPLACE VIEW storefront.active_products AS SELECT * FROM storefront._products WHERE deleted_at IS NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
    BEGIN
        CREATE OR REPLACE VIEW storefront.active_orders AS SELECT * FROM storefront.orders WHERE deleted_at IS NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        CREATE OR REPLACE VIEW governance.active_tenants AS SELECT * FROM governance.tenants WHERE deleted_at IS NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
--> statement-breakpoint
-- Audit 444 Mandate: Deployment of trg_log_drift and Financial Restriction
-- Statement-breakpoint
CREATE OR REPLACE FUNCTION log_schema_drift()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        INSERT INTO governance.audit_logs (
            tenant_id,
            actor_type,
            action,
            entity_type,
            entity_id,
            metadata
        ) VALUES (
            'SYSTEM',
            'system',
            'SCHEMA_DRIFT_DETECTED',
            'DATABASE',
            obj.object_identity,
            jsonb_build_object(
                'command_tag', obj.command_tag,
                'schema', obj.schema_name,
                'object', obj.object_identity
            )
        );
--> statement-breakpoint
END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Statement-breakpoint
-- EVENT TRIGGER trg_audit_schema_drift deferred to final migration

-- Financial Hardening: Ensure RESTRICT for orders and wallet
DO $$ BEGIN
    ALTER TABLE "storefront"."orders" DROP CONSTRAINT IF EXISTS "orders_customer_id_fkey";
    ALTER TABLE "storefront"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "storefront"."customers"("id") ON DELETE RESTRICT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "storefront"."refunds" DROP CONSTRAINT IF EXISTS "refunds_order_id_fkey";
    ALTER TABLE "storefront"."refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "storefront"."orders"("id") ON DELETE RESTRICT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
--> statement-breakpoint
