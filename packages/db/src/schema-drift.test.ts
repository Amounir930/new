import { describe, expect, it } from 'bun:test';

describe('Schema Drift Detection Protocol', () => {
    it('should verify log_drift trigger and function', async () => {
        const fs = await import('node:fs/promises');
        const triggerFile = 'c:/Users/Dell/Desktop/60sec.shop/packages/db/drizzle/0151_ultimate_final_tie_up.sql';
        const complianceFile = 'c:/Users/Dell/Desktop/60sec.shop/packages/db/drizzle/0153_compliance_verification_routine.sql';

        const content151 = await fs.readFile(triggerFile, 'utf8');
        const content153 = await fs.readFile(complianceFile, 'utf8');

        expect(content151).toMatch(/CREATE EVENT TRIGGER trg_log_drift/i);
        expect(content151).toMatch(/EXECUTE FUNCTION governance\.log_schema_drift\(\)/i);
        expect(content153).toMatch(/governance\.verify_compliance\(\)/i);
    });
});
