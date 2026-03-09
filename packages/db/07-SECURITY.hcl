// 6. SECURITY & INTEGRITY RULES (SQL BLOCKS)
// ==========================================

// Strike 25: Audit Logs WORM (Write Once Read Many)
// Protocol: IMMUTABILITY | Targets: audit_logs, wallet_transactions

sql "security_worm_logic" {
  content = <<-SQL
    CREATE OR REPLACE FUNCTION public.prevent_update_delete()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'Table is WORM (Write Once Read Many). Update/Delete forbidden for entity_id: %', OLD.id;
    END;
    $$ LANGUAGE plpgsql;

    -- Activation: audit_logs
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_logs_worm') THEN
        CREATE TRIGGER tr_audit_logs_worm
        BEFORE UPDATE OR DELETE ON governance.audit_logs
        FOR EACH ROW EXECUTE FUNCTION public.prevent_update_delete();
      END IF;
    END $$;

    -- Activation: wallet_transactions
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_wallet_transactions_worm') THEN
        CREATE TRIGGER tr_wallet_transactions_worm
        BEFORE UPDATE OR DELETE ON storefront.wallet_transactions
        FOR EACH ROW EXECUTE FUNCTION public.prevent_update_delete();
      END IF;
    END $$;
  SQL
}

// Strike 26: Financial Guard (Deferrable Credit Utilization)
// Protocol: RACE-CONDITION-SAFETY | Target: b2b_companies

sql "credit_guard_deferrable" {
  content = <<-SQL
    ALTER TABLE storefront.b2b_companies 
    ALTER CONSTRAINT chk_credit_utilization DEFERRABLE INITIALLY DEFERRED;
  SQL
}

// SECURITY (Feedback Loop): Advanced Hardening Protocols
// Protocol: SSRF | Pre-flight DNS resolution required in App Layer
