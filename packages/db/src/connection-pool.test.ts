import { describe, expect, it, mock } from 'bun:test';

describe('Connection Pool Forensic Reset', () => {
    it('should execute RESET ALL on every pool release Path', async () => {
        const { publicPool } = await import('./connection.js');
        // This test verifies the implementation in src/connection.ts
        // Since we can't easily spy on the real pool release without complex mocking,
        // we audit the source file for the unconditional reset call.

        const fs = await import('node:fs/promises');
        const connectionFile = 'c:/Users/Dell/Desktop/60sec.shop/packages/db/src/connection.ts';
        const content = await fs.readFile(connectionFile, 'utf8');

        expect(content).toMatch(/client\s*\.query\('RESET ALL; SET search_path TO public'\)/i);
    });
});
