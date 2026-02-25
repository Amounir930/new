-- Mandate #29: Balanced Ledger & OCC Wallet
-- Enforces extreme mathematical precision for financial transactions.
-- Ensures that the customer's wallet balance stays in sync with the transaction history.

CREATE OR REPLACE FUNCTION storefront.enforce_wallet_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_current_balance_amount BIGINT;
    v_expected_balance_amount BIGINT;
BEGIN
    -- 1. Lock customer row for update (OCC - Optimistic/Pessimistic Hybrid)
    -- This prevents race conditions where two transactions happen simultaneously for the same customer.
    SELECT (wallet_balance).amount INTO v_current_balance_amount
    FROM storefront.customers
    WHERE id = NEW.customer_id
    FOR UPDATE;

    -- 2. Validate transaction amount
    -- NEW.amount is a jsonb/composite. Assuming it has an 'amount' field (BIGINT).
    -- In Drizzle moneyAmount is often stored as JSONB with {amount: bigint, currency: string}
    
    v_expected_balance_amount := v_current_balance_amount + (NEW.amount->>'amount')::BIGINT;

    -- 3. Enforce Balanced Ledger: SUM(credits) = SUM(debits)
    -- Here we verify that NEW.balance_after matches our calculated expected balance.
    IF (NEW.balance_after->>'amount')::BIGINT != v_expected_balance_amount THEN
        RAISE EXCEPTION 'LEDGER_IMBALANCE: Calculated balance % does not match balance_after %', 
            v_expected_balance_amount, (NEW.balance_after->>'amount')::BIGINT
        USING ERRCODE = 'P0004';
    END IF;

    -- 4. Update Customer Wallet Balance atomically
    UPDATE storefront.customers
    SET wallet_balance = jsonb_set(
        wallet_balance, 
        '{amount}', 
        to_jsonb(v_expected_balance_amount)
    ),
    updated_at = NOW()
    WHERE id = NEW.customer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attachment:
DROP TRIGGER IF EXISTS trg_wallet_integrity ON storefront.wallet_transactions;

CREATE TRIGGER trg_wallet_integrity
BEFORE INSERT ON storefront.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION storefront.enforce_wallet_integrity();
