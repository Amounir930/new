/**
 * Migration Runner Tests
 * S2 Protocol: Tenant Migrations
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runTenantMigrations } from './runner.js';

// Mock DB
const mockDb = {
  // Mock DB implementation as needed
};

vi.mock('@apex/db', () => ({
  createTenantDb: vi.fn().mockReturnValue({
    // Mock DB implementation as needed
  }),
}));

vi.mock('drizzle-orm/postgres-js/migrator', () => ({
  migrate: vi.fn().mockResolvedValue(undefined),
}));

describe('runTenantMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
