-- ==========================================
-- APEX V2 SECURITY PROTOCOLS (HOOK)
-- DIRECTIVE: EXECUTIVE OVERRIDE (SEC-2026-HOOK)
-- STATUS: HARDENED | SECURITY: ZERO-TOLERANCE
-- ==========================================

-- 1. EXTENSIONS (Infrastructure Foundation)
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. ROW LEVEL SECURITY (RLS) - Sovereign Isolation
-- ==========================================

-- Governance Schema (Full Coverage)
ALTER TABLE "governance"."tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."tenants" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."tenants";
CREATE POLICY "tenant_isolation_policy" ON "governance"."tenants" 
  FOR ALL TO public USING (id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."audit_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."audit_logs";
CREATE POLICY "tenant_isolation_policy" ON "governance"."audit_logs" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."tenant_quotas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."tenant_quotas" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."tenant_quotas";
CREATE POLICY "tenant_isolation_policy" ON "governance"."tenant_quotas" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."tenant_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."tenant_invoices" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."tenant_invoices";
CREATE POLICY "tenant_isolation_policy" ON "governance"."tenant_invoices" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Extended Governance RLS
ALTER TABLE "governance"."app_usage_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."app_usage_records" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."app_usage_records";
CREATE POLICY "tenant_isolation_policy" ON "governance"."app_usage_records" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."dunning_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."dunning_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."dunning_events";
CREATE POLICY "tenant_isolation_policy" ON "governance"."dunning_events" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."feature_gates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."feature_gates" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."feature_gates";
CREATE POLICY "tenant_isolation_policy" ON "governance"."feature_gates" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."leads" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."leads";
CREATE POLICY "tenant_isolation_policy" ON "governance"."leads" 
  FOR ALL TO public USING (converted_tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."order_fraud_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."order_fraud_scores" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."order_fraud_scores";
CREATE POLICY "tenant_isolation_policy" ON "governance"."order_fraud_scores" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "governance"."plan_change_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "governance"."plan_change_history" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "governance"."plan_change_history";
CREATE POLICY "tenant_isolation_policy" ON "governance"."plan_change_history" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Vault Schema
ALTER TABLE "vault"."encryption_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vault"."encryption_keys" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "vault"."encryption_keys";
CREATE POLICY "tenant_isolation_policy" ON "vault"."encryption_keys" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE "vault"."archival_vault" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vault"."archival_vault" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "vault"."archival_vault";
CREATE POLICY "tenant_isolation_policy" ON "vault"."archival_vault" 
  FOR ALL TO public USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 3. WORM PROTOCOL (Write-Once, Read-Many)
-- ==========================================

CREATE OR REPLACE FUNCTION "public"."fn_enforce_worm_protocol"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'SECURITY VIOLATION: TABLE IS IMMUTABLE (WORM PROTOCOL ACTIVE)';
END;
$$ LANGUAGE plpgsql;

-- Audit Logs WORM
DROP TRIGGER IF EXISTS "trg_audit_logs_worm" ON "governance"."audit_logs";
CREATE TRIGGER "trg_audit_logs_worm"
BEFORE UPDATE OR DELETE ON "governance"."audit_logs"
FOR EACH ROW EXECUTE FUNCTION "public"."fn_enforce_worm_protocol"();

-- Wallet Transactions WORM
DROP TRIGGER IF EXISTS "trg_wallet_transactions_worm" ON "storefront"."wallet_transactions";
CREATE TRIGGER "trg_wallet_transactions_worm"
BEFORE UPDATE OR DELETE ON "storefront"."wallet_transactions"
FOR EACH ROW EXECUTE FUNCTION "public"."fn_enforce_worm_protocol"();

-- 4. FINANCIAL GUARD (Deferrable Constraint Trigger)
-- ==========================================

-- 1. دالة التحقق من الائتمان
CREATE OR REPLACE FUNCTION storefront.enforce_credit_limit()
RETURNS trigger AS $$
BEGIN
  IF NEW.credit_used > NEW.credit_limit THEN
    RAISE EXCEPTION 'Credit limit exceeded for B2B Company ID: %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. زراد القيد القابل للتأجيل (يعمل في نهاية المعاملة - End of Transaction)
DROP TRIGGER IF EXISTS tr_check_credit_limit ON storefront.b2b_companies;
CREATE CONSTRAINT TRIGGER tr_check_credit_limit
  AFTER INSERT OR UPDATE ON storefront.b2b_companies
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION storefront.enforce_credit_limit();

-- 5. AI VECTOR INDEXES (Sovereign Intelligence)
-- ==========================================

CREATE INDEX IF NOT EXISTS "idx_products_embedding_cosine" ON "storefront"."products" 
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "idx_reviews_embedding_cosine" ON "storefront"."reviews" 
  USING hnsw (embedding vector_cosine_ops);

-- 6. TEMPORAL & SPATIAL INDEXES (Restored GIST)
-- ==========================================

CREATE INDEX IF NOT EXISTS "idx_flash_sale_product_overlap" ON "storefront"."flash_sale_products" 
  USING gist (product_id, valid_during);

CREATE INDEX IF NOT EXISTS "idx_price_list_overlap" ON "storefront"."price_lists" 
  USING gist (product_id, variant_id, market_id, quantity_range);

-- Corrected B2B Pricing Tiers Overlap Index
CREATE INDEX IF NOT EXISTS "idx_b2b_pricing_overlap" ON "storefront"."b2b_pricing_tiers" 
  USING gist (company_id, product_id, quantity_range);
