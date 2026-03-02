-- Apex V2 Security Injection Script
-- Consolidated RLS Policies and Triggers from Drizzle Migrations

SET search_path = public, storefront, governance, vault, shared;

-- From 0002_security_hardening.sql

CREATE POLICY tenant_isolation ON %I.%I USING (tenant_id = current_setting(''app.current_tenant'', false)::uuid);

CREATE TRIGGER trg_verify_tenant_session_%I BEFORE INSERT OR UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION %I.verify_tenant_session_%I();




-- From 0003_definitive_hardening.sql

CREATE TRIGGER trg_audit_immutable_update
BEFORE UPDATE ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.enforce_audit_immutability();

CREATE TRIGGER trg_audit_immutable_delete
BEFORE DELETE ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.enforce_audit_immutability();




-- From 0006_financial_and_data_integrity.sql

CREATE TRIGGER trg_check_refund_limit
BEFORE INSERT ON storefront.refunds
FOR EACH ROW EXECUTE FUNCTION storefront.check_refund_limit();

CREATE TRIGGER trg_enforce_coupon_limits
BEFORE INSERT ON storefront.coupon_usages
FOR EACH ROW EXECUTE FUNCTION storefront.enforce_coupon_limits();

CREATE TRIGGER trg_block_inventory_update
BEFORE UPDATE ON storefront.inventory_movements
FOR EACH ROW EXECUTE FUNCTION storefront.block_inventory_mutation();

CREATE TRIGGER trg_block_inventory_delete
BEFORE DELETE ON storefront.inventory_movements
FOR EACH ROW EXECUTE FUNCTION storefront.block_inventory_mutation();




-- From 0007_isolation_and_security_hardening.sql

CREATE POLICY tenant_isolation_policy ON storefront.%I 
                            USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)
                            WITH CHECK (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)', t_name);

CREATE TRIGGER trg_block_auth_log_update
    BEFORE UPDATE ON public.auth_logs
    FOR EACH ROW EXECUTE FUNCTION governance.enforce_audit_immutability();

CREATE TRIGGER trg_block_auth_log_delete
    BEFORE DELETE ON public.auth_logs
    FOR EACH ROW EXECUTE FUNCTION governance.enforce_audit_immutability();

CREATE TRIGGER trg_encrypt_app_secrets
BEFORE INSERT OR UPDATE ON storefront.app_installations
FOR EACH ROW EXECUTE FUNCTION storefront.encrypt_app_secrets();


