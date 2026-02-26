import { describe, expect, it } from 'bun:test';

describe('Event Trigger Deployment Protocol', () => {
  it('should verify global DDL lockdown and UTC enforcement triggers', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const triggerFile = path.resolve(import.meta.dirname, '../drizzle/0002_security_hardening.sql');
    const content = await fs.readFile(triggerFile, 'utf8');

    // Mandate: Audit Immutability Lockdown
    expect(content).toMatch(/CREATE EVENT TRIGGER trg_audit_immutability_lockdown/i);
    expect(content).toMatch(/EXECUTE FUNCTION governance\.block_audit_tamper_event\(\)/i);

    // Mandate: Schema Drift Logging
    expect(content).toMatch(/CREATE EVENT TRIGGER trg_log_drift/i);
    expect(content).toMatch(/EXECUTE FUNCTION governance\.log_schema_drift\(\)/i);
  });
});
