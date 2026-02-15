/**
 * Migration Runner Tests
 * S2 Protocol: Tenant Migrations
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { runTenantMigrations } from './runner.js';

// Mock DB
const mockDb = {
  // Mock DB implementation as needed
};

mock.module('@apex/db', () => ({
  createTenantDb: mock().mockReturnValue({
    // Mock DB implementation as needed
  }),
}));

mock.module('drizzle-orm/postgres-js/migrator', () => ({
  migrate: mock().mockResolvedValue(undefined),
}));

describe('runTenantMigrations', () => {
  beforeEach(() => {
    mock.restore();
  });

  it('should execute migrations for the given tenant', async () => {
    const subdomain = 'alpha';
    const result = await runTenantMigrations(subdomain);

    expect(result.schemaName).toBe(`tenant_${subdomain}`);
    expect(result.appliedCount).toBeGreaterThan(0);
    expect(migrate).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        migrationsFolder: expect.any(String),
      })
    );
  });

  it('should throw and log if migration fails', async () => {
    (migrate as any).mockRejectedValueOnce(new Error('Migration Crash'));
    await expect(runTenantMigrations('fail')).rejects.toThrow(
      'Migration Crash'
    );
  });
});
