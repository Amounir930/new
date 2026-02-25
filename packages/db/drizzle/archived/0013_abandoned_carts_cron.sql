-- 🛡️ V6 RED TEAM AUDIT - CART ABANDONMENT DOS (MANDATE #14)

-- Malicious bots creating infinite carts exhaust the DB storage.
-- MANDATE: Implement pg_cron SQL migration to permanently DELETE FROM abandoned_checkouts 
-- WHERE created_at < NOW() - INTERVAL '60 days'.

SELECT cron.schedule(
    'sweep_abandoned_checkouts',
    '0 2 * * *', -- Run daily at 2:00 AM
    $$ DELETE FROM storefront.abandoned_checkouts WHERE created_at < NOW() - INTERVAL '60 days' $$
);
