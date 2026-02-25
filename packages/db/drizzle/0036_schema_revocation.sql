-- Mandate #5: Public Schema Lockdown
-- Revokes all privileges on public schema from tenant roles to prevent metadata leakage.

DO $$ 
BEGIN
    -- Create the roles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tenant_role') THEN
        CREATE ROLE tenant_role;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'super_admin_role') THEN
        CREATE ROLE super_admin_role;
    END IF;

    -- Revoke everything from public except USAGE (required to see types/built-ins)
    REVOKE ALL ON SCHEMA public FROM tenant_role;
    GRANT USAGE ON SCHEMA public TO tenant_role;
    
    -- Ensure tenant_role cannot see governance or vault schemas
    REVOKE ALL ON SCHEMA governance FROM tenant_role;
    REVOKE ALL ON SCHEMA vault FROM tenant_role;
    
    -- Super Admin gets full access
    GRANT ALL ON SCHEMA public TO super_admin_role;
    GRANT ALL ON SCHEMA governance TO super_admin_role;
    GRANT ALL ON SCHEMA vault TO super_admin_role;

END $$;
