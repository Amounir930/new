import fs from 'node:fs';
import path from 'node:path';

const drizzleDir = './packages/db/drizzle';
const metaDir = path.join(drizzleDir, 'meta');

if (!fs.existsSync(metaDir)) {
  fs.mkdirSync(metaDir, { recursive: true });
}

// List of migrations in order
const migrations = [
  '0001_baseline',
  '0002_security_hardening',
  '0003_definitive_hardening',
  '0004_phase1_infrastructure',
  '0005_commerce_completion',
  '0006_financial_and_data_integrity',
  '0007_isolation_and_security_hardening',
  '0008_infrastructure_and_performance_tuning',
  '0009_critical_fixes',
  '0010_public_schema_isolation',
];

const journal = {
  version: '7',
  dialect: 'postgresql',
  entries: migrations.map((tag, idx) => ({
    idx,
    version: '7',
    when: Date.now() + idx,
    tag,
    breakpoints: true,
  })),
};

fs.writeFileSync(
  path.join(metaDir, '_journal.json'),
  JSON.stringify(journal, null, 2)
);

process.stdout.write('Successfully reconstructed _journal.json\n');
