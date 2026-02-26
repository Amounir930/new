import { describe, expect, it } from 'bun:test';

describe('Schema Drift Detection Protocol', () => {
  it('should verify log_drift trigger and function', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const triggerFile = path.resolve(import.meta.dirname, '../drizzle/0002_security_hardening.sql');

    const content = await fs.readFile(triggerFile, 'utf8');

    expect(content).toMatch(/CREATE EVENT TRIGGER trg_log_drift/i);
    expect(content).toMatch(/EXECUTE FUNCTION governance\.log_schema_drift\(\)/i);
    expect(content).toMatch(/governance\.verify_compliance\(\)/i);
  });
});
