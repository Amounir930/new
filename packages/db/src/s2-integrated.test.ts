import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { sql } from 'drizzle-orm';

// --- MOCK SETUP ---
let currentPath = 'public';

const mockClientInstance = {
  connect: mock().mockResolvedValue(undefined),
  query: mock().mockImplementation(async (q) => {
    const text = typeof q === 'string' ? q : q.text;
    if (text.includes('SET search_path TO')) {
      const match = text.match(/TO "([^"]+)"/i);
      if (match) currentPath = match[1];
      return { rows: [], rowCount: 0 };
    }
    if (text.includes('current_schema()')) {
      return { rows: [{ current_schema: currentPath }] };
    }
    if (text.includes('SHOW search_path')) {
      return { rows: [{ search_path: currentPath }] };
    }
    if (text.includes('SELECT name FROM products')) {
      const rows = currentPath.includes('alpha')
        ? [{ name: 'Alpha Secret' }]
        : currentPath.includes('beta')
          ? [{ name: 'Beta Secret' }]
          : [];
      return { rows, rowCount: rows.length };
    }
    return { rows: [], rowCount: 0 };
  }),
  end: mock().mockImplementation(async () => {
    currentPath = 'public';
  }),
  release: mock(),
};

const mockPool = {
  connect: mock().mockResolvedValue(mockClientInstance),
  query: mock().mockImplementation(async (q) => {
    const text = typeof q === 'string' ? q : q.text;
    if (text.includes('SELECT id, subdomain, status FROM tenants')) {
      return {
        rows: [{ id: 't1', subdomain: 'alpha', status: 'active' }],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 0 };
  }),
};

// Mock pg module
const pgMock = {
  Pool: mock().mockImplementation(() => mockPool),
  Client: mock().mockImplementation(() => mockClientInstance),
};
mock.module('pg', () => ({
  ...pgMock,
  default: pgMock,
}));

// Mock connection module
mock.module('./connection.js', () => ({
  publicPool: mockPool,
  publicDb: { execute: mock().mockResolvedValue({ rows: [] }) },
  db: { execute: mock().mockResolvedValue({ rows: [] }) },
  poolConfig: { connectionString: 'postgres://localhost:5432' },
}));

// Import module AFTER mocking
const { withTenantConnection } = await import('./core.js');

// --- INTEGRATED TESTS ---
describe('S2: Integrated Tenant Isolation Protocol', () => {
  const tenantA = 'alpha';
  const _tenantB = 'beta';

  beforeEach(() => {
    currentPath = 'public';
    mockClientInstance.query.mockClear();
    mockClientInstance.connect.mockClear();
    mockClientInstance.end.mockClear();
    mockPool.query.mockClear();
  });

  it('should execute operation within correct search_path', async () => {
    await withTenantConnection(tenantA, async (db) => {
      const result = await db.execute(sql`SELECT name FROM products`);
      expect(result.rows[0].name).toBe('Alpha Secret');

      const pathRes = await db.execute(sql`SHOW search_path`);
      expect(pathRes.rows[0].search_path).toContain('tenant_alpha');
    });
  });

  it('should reset state after successful operation', async () => {
    await withTenantConnection(tenantA, async () => {});
    expect(currentPath).toBe('public');
    expect(mockClientInstance.end).toHaveBeenCalled();
  });

  it('should NEVER leak tenant context after a crash (Fail-Safe)', async () => {
    try {
      await withTenantConnection(tenantA, async () => {
        throw new Error('CRITICAL_FAILURE');
      });
    } catch {
      /* Expected */
    }

    expect(currentPath).toBe('public');
    expect(mockClientInstance.end).toHaveBeenCalled();
  });

  it('should NOT have cross-tenant schemas in pool connections', async () => {
    await withTenantConnection(tenantA, async () => {});

    // Check fresh mock connection
    const client = await mockPool.connect();
    const res = await client.query('SHOW search_path');
    expect(res.rows[0].search_path).not.toContain('tenant_alpha');
  });

  it('should throw S2 Violation for invalid tenant', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    try {
      await withTenantConnection('non-existent', async () => {});
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain('S2 Violation');
    }
  });
});
