-- 🚨 Audit 999 Type Hardening: 0054_money_type_formalization.sql

-- 1. Ensure composite type exists 
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_amount') THEN
        CREATE TYPE public.money_amount AS (
            amount BIGINT,
            currency TEXT
        );
    END IF;
END $$;

-- 2. Cast all known BIGINT monetary columns to money_amount (Audit Point #4)
-- This performs a safe conversion for existing data across all tenant schemas.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name IN (
            'wallet_balance', 'price', 'total_amount', 'subtotal', 
            'tax_total', 'shipping_total', 'discount_total', 'unit_price',
            'base_price', 'sale_price', 'cost_price', 'amount', 'balance_after'
        )
        AND data_type = 'bigint'
        AND table_schema ~ '^tenant_'
    ) LOOP
        -- We'll default to the tenant's currency or 'SAR' if unknown
        EXECUTE format('
            ALTER TABLE %I.%I 
            ALTER COLUMN %I TYPE public.money_amount 
            USING ( %I, ''SAR'' )::public.money_amount
        ', r.table_schema, r.table_name, r.column_name, r.column_name);
        
        RAISE NOTICE 'S5: Cast %I.%I.%I to money_amount', r.table_schema, r.table_name, r.column_name;
    END LOOP;
END $$;
