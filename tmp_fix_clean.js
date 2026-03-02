import fs from 'fs';

const filePath = 'packages/db/drizzle/0002_security_hardening.sql';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the messy pg_cron line
content = content.replace(
  /DO \$\$ BEGIN PERFORM 1 FROM pg_available_extensions WHERE name = 'pg_cron'; IF FOUND THEN DO \$ BEGIN PERFORM 1 FROM pg_available_extensions WHERE name = 'pg_cron'; IF FOUND THEN CREATE EXTENSION IF NOT EXISTS "pg_cron"; END IF; END \$\$; END IF; END \$\$;/,
  "DO $$ BEGIN PERFORM 1 FROM pg_available_extensions WHERE name = 'pg_cron'; IF FOUND THEN EXECUTE 'CREATE EXTENSION IF NOT EXISTS \"pg_cron\"'; END IF; END $$;"
);

// 2. Ensure all single dollar DO blocks are gone
content = content.replace(/DO \$(?!\$)/g, 'DO $$');
content = content.replace(/END \$(?!\$)/g, 'END $$');

fs.writeFileSync(filePath, content);
console.log('Cleaned up 0002_security_hardening.sql syntax.');
