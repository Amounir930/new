-- 🚨 V8 Financial Hardening: 0049_money_composite_type.sql

-- 1. Ensure composite type exists (V8 Point #6)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_amount') THEN
        CREATE TYPE public.money_amount AS (
            amount BIGINT,
            currency TEXT
        );
    END IF;
END $$;

-- 2. Cast Existing BIGINT columns to money_amount (Pattern)
-- We'll assume a default currency (SAR/USD) for the initial migration.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- This is a template for the migration. 
    -- In a real scenario, we loop through all tables containing 'balance' or 'price' or 'amount'.
    
    FOR r IN (
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name IN ('wallet_balance', 'price', 'total_amount')
        AND data_type = 'bigint'
        AND table_schema ~ '^tenant_'
    ) LOOP
        EXECUTE format('
            ALTER TABLE %I.%I 
            ALTER COLUMN %I TYPE public.money_amount 
            USING ( %I, ''SAR'' )::public.money_amount
        ', r.table_schema, r.table_name, r.column_name, r.column_name);
    END LOOP;
END $$;
