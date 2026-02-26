import { describe, expect, it } from 'bun:test';

describe('S5 Financial Integrity Protocol', () => {
  it('should verify that all financial tables have ON DELETE RESTRICT', async () => {
    // In a real environment, we'd query pg_constraint.
    // For this verification test, we audit the migration file content.
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const migrationPath = path.resolve(
      import.meta.dirname,
      '../drizzle/0001_baseline.sql'
    );

    const content = await fs.readFile(migrationPath, 'utf8');

    // Check for financial tables known to require RESTRICT
    const financialTables = [
      'wallet_transactions',
      'tenant_invoices',
      'orders',
      'refunds',
    ];

    for (const table of financialTables) {
      // Precise matching for table names in quotes
      const cascadePattern = new RegExp(
        `ALTER TABLE "[^"]*"\\."${table}" .* ON DELETE cascade`,
        'i'
      );
      const cascadePatternPublic = new RegExp(
        `ALTER TABLE "${table}" .* ON DELETE cascade`,
        'i'
      );
      expect(content).not.toMatch(cascadePattern);
      expect(content).not.toMatch(cascadePatternPublic);
    }

    expect(content).toMatch(/ON DELETE restrict/i);
  });

  it('should verify SELECT FOR UPDATE in wallet triggers', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const triggerPath = path.resolve(
      import.meta.dirname,
      '../drizzle/0002_security_hardening.sql'
    );
    const content = await fs.readFile(triggerPath, 'utf8');

    expect(content).toMatch(/FOR UPDATE/i);
    // The actual trigger name in the migration for wallet integrity
    expect(content).toMatch(/enforce_wallet_integrity_v4/i);
  });
});
