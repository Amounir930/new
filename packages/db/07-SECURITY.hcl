// 6. SECURITY & INTEGRITY RULES (SQL BLOCKS)
// ==========================================
sql "webhook_https_enforcement" {
  depends_on = [table.webhook_subscriptions]
  exec = <<SQL
CREATE OR REPLACE FUNCTION storefront.validate_webhook_https()
RETURNS TRIGGER AS $$
BEGIN
IF NEW.target_url IS NOT NULL AND (NEW.target_url !~ '^https://' OR NEW.target_url ~ '^https?://(10\\.|192\\.168\\.|127\\.|172\\.(1[6-9]|2[0-9]|3[0-1])\\.|169\\.254\\.|0?\\d{1,3}
  \\.0?\\d{1,3}\\.|\\[::1\\]|localhost|\\.local|\\.internal)') THEN
    RAISE EXCEPTION 'Security Violation: Webhook URLs must use HTTPS and public IPs only' USING ERRCODE = 'P0009';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_webhook_https_enforce
BEFORE INSERT OR UPDATE ON storefront.webhook_subscriptions
FOR EACH ROW EXECUTE FUNCTION storefront.validate_webhook_https();
SQL
}
sql "outbox_event_processing_rule" {
  depends_on = [table.outbox_events]
  exec = <<SQL
CREATE OR REPLACE FUNCTION storefront.process_outbox_batch()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM storefront.outbox_events 
    WHERE status = 'pending' 
    AND created_at < now() - interval '5 seconds'
    ORDER BY created_at ASC
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      PERFORM pg_notify('outbox_events', r.id::text);
      
      UPDATE storefront.outbox_events 
      SET status = 'completed', processed_at = now()
      WHERE id = r.id AND created_at = r.created_at;
    EXCEPTION WHEN OTHERS THEN
      UPDATE storefront.outbox_events 
      SET status = 'failed', retry_count = retry_count + 1
      WHERE id = r.id AND created_at = r.created_at;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
SQL
}
sql "rls_04_marketing_systems" {
  schema = schema.storefront
  as = <<SQL
-- Coupons
ALTER TABLE storefront.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.coupons FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.coupons;
CREATE POLICY tenant_isolation_policy ON storefront.coupons 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Price Rules
ALTER TABLE storefront.price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.price_rules FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.price_rules;
CREATE POLICY tenant_isolation_policy ON storefront.price_rules 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Discount Codes
ALTER TABLE storefront.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.discount_codes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.discount_codes;
CREATE POLICY tenant_isolation_policy ON storefront.discount_codes 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Flash Sales
ALTER TABLE storefront.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.flash_sales FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.flash_sales;
CREATE POLICY tenant_isolation_policy ON storefront.flash_sales 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Flash Sale Products
ALTER TABLE storefront.flash_sale_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.flash_sale_products FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.flash_sale_products;
CREATE POLICY tenant_isolation_policy ON storefront.flash_sale_products 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Product Bundles
ALTER TABLE storefront.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_bundles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_bundles;
CREATE POLICY tenant_isolation_policy ON storefront.product_bundles 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Product Bundle Items
ALTER TABLE storefront.product_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_bundle_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_bundle_items;
CREATE POLICY tenant_isolation_policy ON storefront.product_bundle_items 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Loyalty Rules
ALTER TABLE storefront.loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.loyalty_rules FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.loyalty_rules;
CREATE POLICY tenant_isolation_policy ON storefront.loyalty_rules 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Affiliate Partners
ALTER TABLE storefront.affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.affiliate_partners FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.affiliate_partners;
CREATE POLICY tenant_isolation_policy ON storefront.affiliate_partners 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Affiliate Transactions
ALTER TABLE storefront.affiliate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.affiliate_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.affiliate_transactions;
CREATE POLICY tenant_isolation_policy ON storefront.affiliate_transactions 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Staff Roles
ALTER TABLE storefront.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.staff_roles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.staff_roles;
CREATE POLICY tenant_isolation_policy ON storefront.staff_roles 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Staff Members
ALTER TABLE storefront.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.staff_members FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.staff_members;
CREATE POLICY tenant_isolation_policy ON storefront.staff_members 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR (current_setting('app.is_superadmin', true) = 'true'));

-- Staff Sessions
ALTER TABLE storefront.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.staff_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.staff_sessions;
CREATE POLICY tenant_isolation_policy ON storefront.staff_sessions 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- App Installations
ALTER TABLE storefront.app_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.app_installations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.app_installations;
CREATE POLICY tenant_isolation_policy ON storefront.app_installations 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Webhook Subscriptions
ALTER TABLE storefront.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.webhook_subscriptions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.webhook_subscriptions;
CREATE POLICY tenant_isolation_policy ON storefront.webhook_subscriptions 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Pages
ALTER TABLE storefront.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.pages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.pages;
CREATE POLICY tenant_isolation_policy ON storefront.pages 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR (current_setting('app.is_superadmin', true) = 'true'));

-- Blog Posts
ALTER TABLE storefront.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.blog_posts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.blog_posts;
CREATE POLICY tenant_isolation_policy ON storefront.blog_posts 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid AND deleted_at IS NULL OR (current_setting('app.is_superadmin', true) = 'true'));

-- Legal Pages
ALTER TABLE storefront.legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.legal_pages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.legal_pages;
CREATE POLICY tenant_isolation_policy ON storefront.legal_pages 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- FAQ Categories
ALTER TABLE storefront.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.faq_categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.faq_categories;
CREATE POLICY tenant_isolation_policy ON storefront.faq_categories 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- FAQs
ALTER TABLE storefront.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.faqs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.faqs;
CREATE POLICY tenant_isolation_policy ON storefront.faqs 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- KB Categories
ALTER TABLE storefront.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.kb_categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.kb_categories;
CREATE POLICY tenant_isolation_policy ON storefront.kb_categories 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- KB Articles
ALTER TABLE storefront.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.kb_articles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.kb_articles;
CREATE POLICY tenant_isolation_policy ON storefront.kb_articles 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Product Views
ALTER TABLE storefront.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.product_views FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.product_views;
CREATE POLICY tenant_isolation_policy ON storefront.product_views 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Outbox Events
ALTER TABLE storefront.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.outbox_events;
CREATE POLICY tenant_isolation_policy ON storefront.outbox_events 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Tenant Config
ALTER TABLE storefront.tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.tenant_config FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.tenant_config;
CREATE POLICY tenant_isolation_policy ON storefront.tenant_config 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Markets
ALTER TABLE storefront.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.markets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.markets;
CREATE POLICY tenant_isolation_policy ON storefront.markets 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Price Lists
ALTER TABLE storefront.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.price_lists FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.price_lists;
CREATE POLICY tenant_isolation_policy ON storefront.price_lists 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Currency Rates
ALTER TABLE storefront.currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.currency_rates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.currency_rates;
CREATE POLICY tenant_isolation_policy ON storefront.currency_rates 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Banners
ALTER TABLE storefront.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.banners FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.banners;
CREATE POLICY tenant_isolation_policy ON storefront.banners 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Announcement Bars
ALTER TABLE storefront.announcement_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.announcement_bars FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.announcement_bars;
CREATE POLICY tenant_isolation_policy ON storefront.announcement_bars 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Popups
ALTER TABLE storefront.popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront.popups FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON storefront.popups;
CREATE POLICY tenant_isolation_policy ON storefront.popups 
  AS RESTRICTIVE FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR (current_setting('app.is_superadmin', true) = 'true'));

-- Strike 30: Tenant Archival Auto-Lockdown
CREATE OR REPLACE FUNCTION governance.lockdown_archived_tenant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('suspended', 'archived') THEN
    UPDATE storefront.app_installations SET is_active = false WHERE tenant_id = NEW.id;
    UPDATE storefront.staff_sessions SET revoked_at = now() WHERE tenant_id = NEW.id AND revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_lockdown ON governance.tenants;
CREATE TRIGGER trg_tenant_lockdown
AFTER UPDATE OF status ON governance.tenants
FOR EACH ROW EXECUTE FUNCTION governance.lockdown_archived_tenant();
SQL
}

// ==========================================
// ELITE ANALYTICS: MATERIALIZED VIEWS
// Restoration protocol: Directive Delta
// ==========================================

sql "analytical_views" {
  exec = <<SQL
CREATE MATERIALIZED VIEW IF NOT EXISTS storefront.mv_best_sellers AS
SELECT p.id, p.tenant_id, p.name, p.slug, p.base_price, p.main_image,
       COALESCE(SUM(oi.quantity), 0) AS total_sold
FROM storefront.products p
LEFT JOIN storefront.order_items oi ON p.id = oi.product_id
LEFT JOIN storefront.orders o ON oi.order_id = o.id
  AND o.status IN ('delivered','shipped') AND o.deleted_at IS NULL
WHERE p.is_active = true AND p.deleted_at IS NULL
GROUP BY p.id, p.tenant_id ORDER BY total_sold DESC;

-- ELITE: View Isolation (Standard View Wrapper prevents Engine Crash)
CREATE OR REPLACE VIEW storefront.v_best_sellers_isolated AS 
  SELECT * FROM storefront.mv_best_sellers 
  WHERE tenant_id = current_setting('app.current_tenant', true)::uuid;

CREATE MATERIALIZED VIEW IF NOT EXISTS governance.mv_tenant_billing AS
SELECT tenant_id, date_trunc('month', created_at AT TIME ZONE 'Asia/Riyadh') AS period,
       COUNT(*) AS orders_count, SUM((total).amount) AS revenue
FROM storefront.orders WHERE deleted_at IS NULL
GROUP BY 1, 2;
SQL
}
// Strike 25: Audit Logs WORM (Write Once Read Many)
sql "audit_worm_protection" {
  exec = <<SQL
CREATE OR REPLACE FUNCTION governance.block_audit_mutation()
RETURNS TRIGGER AS 451
BEGIN
  RAISE EXCEPTION 'Audit records are immutable. Mutation blocked by Strike 25.';
END;
451 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_worm ON governance.audit_logs;
CREATE TRIGGER trg_audit_worm
BEFORE UPDATE OR DELETE ON governance.audit_logs
FOR EACH ROW EXECUTE FUNCTION governance.block_audit_mutation();
SQL
}

// SECURITY (Feedback Loop): Advanced Hardening Protocols
sql "advanced_hardening_v2" {
  exec = <<SQL
-- 1. Vault Schema Lockdown
REVOKE ALL ON SCHEMA vault FROM PUBLIC;
REVOKE ALL ON SCHEMA vault FROM app_user;

-- 2. Session Context Protection (Restrict SET to superadmin/trusted)
-- Note: app_user should only set this via secure login functions
REVOKE ALL ON FUNCTION set_config(text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO superadmin;

-- 3. System Table RLS (Governance)
ALTER TABLE governance.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance.system_config FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_only_config ON governance.system_config;
CREATE POLICY superadmin_only_config ON governance.system_config 
  AS RESTRICTIVE FOR ALL 
  TO app_user
  USING (current_setting('app.is_superadmin', true) = 'true');

ALTER TABLE governance.tenant_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance.tenant_quotas FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_quota_isolation ON governance.tenant_quotas;
CREATE POLICY tenant_quota_isolation ON governance.tenant_quotas 
  AS RESTRICTIVE FOR ALL 
  TO app_user
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
SQL
}
