-- 🛡️ V6 FATAL AUDIT - GOVERNANCE TRIGGERS (MANDATE #17)

-- MANDATE #17: Price List Currency Mismatch
-- Ensure PriceLists matches the currency of the mapped Commerce Market at the DB Engine level.
CREATE OR REPLACE FUNCTION check_price_list_currency_match()
RETURNS TRIGGER AS $$
DECLARE
    market_currency TEXT;
BEGIN
    SELECT currency_code INTO market_currency 
    FROM storefront.commerce_markets 
    WHERE id = NEW.market_id;

    IF NEW.currency != market_currency THEN
        RAISE EXCEPTION 'PriceList Currency Mismatch: Price list currency (%) must match market currency (%).', NEW.currency, market_currency USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_price_list_currency ON storefront.price_lists;
CREATE TRIGGER trg_check_price_list_currency
BEFORE INSERT OR UPDATE ON storefront.price_lists
FOR EACH ROW EXECUTE FUNCTION check_price_list_currency_match();
