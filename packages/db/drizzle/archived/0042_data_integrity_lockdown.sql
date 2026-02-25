-- Mandate #41: Financial Precision (S5 Compliance)
-- Uses a custom domain to enforce non-negative micro-amounts across the entire platform.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'micro_amount_type') THEN
        CREATE DOMAIN micro_amount_type AS BIGINT
        CHECK (VALUE >= 0);
    END IF;
END $$;

-- Mandate #42: Wallet Integrity
-- Prevents race conditions that could lead to negative wallet balances.

ALTER TABLE storefront.customers 
ADD CONSTRAINT chk_positive_wallet CHECK (wallet_balance >= 0);

-- Mandate #44: Duplicate SKU Injection Defense
-- Enforces per-tenant SKU uniqueness at the DB level, not just application code.

-- Note: storefront tables are in dynamic schemas. 
-- We apply this via a loop in a migration or via the blueprint logic.
-- Here we'll add a helper function for the provisioner.

CREATE OR REPLACE FUNCTION governance.enforce_sku_uniqueness(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS uq_sku_per_tenant ON %I.products (sku, tenant_id)', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Mandate #43: Block Orphaned Orders
-- Ensures that an order cannot exist without a valid tenant_id and customer_id.

-- Already handled by NOT NULL + FKs in most tables, but we reinforcement here.
-- This migration will be applied to all existing tenant schemas.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM information_schema.schemata WHERE schema_name ~ '^tenant_' LOOP
        EXECUTE format('ALTER TABLE %I.orders ADD CONSTRAINT chk_order_integrity CHECK (tenant_id IS NOT NULL AND customer_id IS NOT NULL)', r.schema_name);
    END LOOP;
END $$;
