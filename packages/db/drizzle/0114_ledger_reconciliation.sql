-- 📊 Audit Remediation: 0114_ledger_reconciliation.sql
-- Risk #30: Automated Daily Ledger Reconciliation.

-- 1. Create Reconciliation View
-- Compares wallet balance against transaction log sum
CREATE MATERIALIZED VIEW governance.mv_ledger_recon AS
SELECT 
    c.tenant_id,
    c.id as customer_id,
    (c.wallet_balance->>'amount')::BIGINT as recorded_balance,
    COALESCE(SUM(l.amount), 0) as calculated_balance,
    (c.wallet_balance->>'amount')::BIGINT - COALESCE(SUM(l.amount), 0) as discrepancy,
    NOW() as last_verified_at
FROM storefront.customers c
LEFT JOIN storefront.order_payment_logs l ON l.customer_id = c.id AND l.status = 'completed'
GROUP BY c.tenant_id, c.id, c.wallet_balance;

-- 2. Index for fast querying
CREATE UNIQUE INDEX idx_mv_ledger_recon_customer ON governance.mv_ledger_recon (customer_id);

-- 3. Grant admin access
GRANT SELECT ON governance.mv_ledger_recon TO super_admin_role;

RAISE NOTICE 'S5: Ledger Reconciliation View (Risk #30) created.';
