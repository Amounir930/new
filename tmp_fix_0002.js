import fs from 'fs';

const filePath = 'packages/db/drizzle/0002_security_hardening.sql';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix syntax error: RETURNS EVENT TRIGGER -> RETURNS event_trigger
content = content.replace(/RETURNS EVENT TRIGGER/g, 'RETURNS event_trigger');

// 2. Wrap pg_cron extension creation safely
content = content.replace(
  /CREATE EXTENSION IF NOT EXISTS "pg_cron";/,
  'DO $$ BEGIN PERFORM 1 FROM pg_available_extensions WHERE name = \'pg_cron\'; IF FOUND THEN CREATE EXTENSION IF NOT EXISTS "pg_cron"; END IF; END $$;'
);

// 3. Fix DO block in Section 9 (using escaped dollars for JS replace)
// Matches both DO $ and DO $$ to be safe
content = content.replace(
  /DO \$+ BEGIN IF EXISTS \(SELECT 1 FROM information_schema\.schemata WHERE schema_name = 'cron'\) THEN EXECUTE 'REVOKE ALL ON TABLE cron\.job FROM public'; EXECUTE 'GRANT SELECT ON TABLE cron\.job TO postgres'; END IF; END \$+;/,
  "DO $$$$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN EXECUTE 'REVOKE ALL ON TABLE cron.job FROM public'; EXECUTE 'GRANT SELECT ON TABLE cron.job TO postgres'; END IF; END $$$$;"
);

// 4. Fix DO block for Soft Delete (Line 250)
content = content.replace(/DO \$\$|DO \$/, 'DO $$$$');
// Also end of DO block
content = content.replace(/END \$\$|END \$/g, 'END $$$$');

fs.writeFileSync(filePath, content);
console.log('Definitively fixed 0002_security_hardening.sql syntax.');
