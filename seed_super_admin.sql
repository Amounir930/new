
-- 2.5 Security Policy (The Authentication Bridge)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_service_read_users') THEN
        CREATE POLICY "auth_service_read_users" ON "governance"."users" FOR SELECT USING (true);
    END IF;
END
$$;

ALTER TABLE governance.users DROP CONSTRAINT IF EXISTS chk_user_pwd_hash;
ALTER TABLE governance.users ADD CONSTRAINT chk_user_pwd_hash CHECK (password_hash ~ $re$^\$2[ayb]\$.+$re$);

-- 3. Bootstrap Seeding (Super Admin)
INSERT INTO "governance"."users" (
    email, 
    email_hash, 
    password_hash, 
    roles
) VALUES (
    '{"enc":"ea12f64341fefddaaf39782afa1797f3","iv":"a7734a72b8e7687c0e4fc69b","tag":"4453edd6615ed77e81e78c7b1d50eb3d","data":{"v":1}}'::jsonb,
    '02d1923b2528a8549c57cb261ee090372c41f4ff72968aaaff6e8c766ca7f914',
    '$2b$12$v/IYSLv3JynNXoRMNvezo.fBF9/yqHnPjg4fpX7ZtEoX9CX6jT4Te',
    ARRAY['super_admin']
) ON CONFLICT (email_hash) DO UPDATE SET password_hash = EXCLUDED.password_hash;
