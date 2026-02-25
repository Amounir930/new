import { describe, expect, it } from 'bun:test';

describe('Event Trigger Deployment Protocol', () => {
    it('should verify global DDL lockdown and UTC enforcement triggers', async () => {
        const fs = await import('node:fs/promises');
        const triggerFile = 'c:/Users/Dell/Desktop/60sec.shop/packages/db/drizzle/0151_ultimate_final_tie_up.sql';
        const content = await fs.readFile(triggerFile, 'utf8');

        expect(content).toMatch(/CREATE EVENT TRIGGER trg_ultimate_ddl_lockdown/i);
        expect(content).toMatch(/CREATE EVENT TRIGGER trg_ultimate_utc_enforcement/i);
        expect(content).toMatch(/EXECUTE FUNCTION governance\.block_audit_truncate_event\(\)/i);
    });
});
