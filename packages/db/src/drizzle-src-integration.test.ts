import { describe, expect, it } from 'bun:test';

describe('Drizzle-Source Relationship Integrity', () => {
    it('should verify that drizzle.config.ts covers all schema domains', async () => {
        const fs = await import('node:fs/promises');
        const configFile = 'c:/Users/Dell/Desktop/60sec.shop/packages/db/drizzle.config.ts';
        const content = await fs.readFile(configFile, 'utf8');

        // Audit 444 Point #13: Ensure glob patterns for all domains
        expect(content).toMatch(/\.\/src\/schema\/storefront\/\*\.ts/i);
        expect(content).toMatch(/\.\/src\/schema\/global\.ts/i);
        expect(content).toMatch(/\.\/src\/schema\/v5-core\.ts/i);
    });

    it('should verify compliance check in migrate.ts', async () => {
        const fs = await import('node:fs/promises');
        const migrateFile = 'c:/Users/Dell/Desktop/60sec.shop/packages/db/src/migrate.ts';
        const content = await fs.readFile(migrateFile, 'utf8');

        expect(content).toMatch(/governance\.verify_compliance\(\)/i);
    });
});
