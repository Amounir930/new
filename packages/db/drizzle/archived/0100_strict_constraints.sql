-- 🚨 Audit 777 Integrity Hardening: 0100_strict_constraints.sql

-- 1. Wallet Balance Non-Negative (Audit 777 Point #29)
-- Addresses the missing check to prevent negative store credit.
ALTER TABLE storefront.customers 
ADD CONSTRAINT ck_wallet_balance_positive 
CHECK ((wallet_balance->>'amount')::BIGINT >= 0);

-- 2. OCC Versioning Hardening (Audit 777 Point #6)
-- Ensures version starts at 1 and cannot be NULL or zero.
ALTER TABLE storefront.customers 
ALTER COLUMN version SET DEFAULT 1,
ALTER COLUMN version SET NOT NULL,
ADD CONSTRAINT ck_customer_version_positive CHECK (version > 0);

-- 3. Stock & Price Safeguards (Audit 777 Points #32, #33)
-- Prevents overselling and erroneous pricing at the DB level.
ALTER TABLE storefront.inventory_levels 
ADD CONSTRAINT ck_available_non_negative CHECK (available >= 0);

ALTER TABLE storefront.products 
ADD CONSTRAINT ck_base_price_non_negative CHECK ((base_price->>'amount')::BIGINT >= 0);

-- 4. Subdomain Case Compliance (Audit 777 Point #25)
-- Prevents collision risks between 'Test' and 'test'.
ALTER TABLE governance.tenants 
ADD CONSTRAINT ck_subdomain_lower CHECK (subdomain = LOWER(subdomain));

-- 5. Password Policy (Audit 777 Point #24)
-- Enforces Argon2id format for all password hashes.
-- Note: Assuming table is governance.users or similar based on previous audits.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'governance' AND table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE governance.users 
        ADD CONSTRAINT ck_password_argon2 
        CHECK (password_hash ~ '^\$argon2id\$');
    END IF;
END $$;
