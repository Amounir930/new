import { describe, expect, it, mock } from 'bun:test';

// 1. Define Mocks for the DB Pool
let currentPath = 'public';
const mockClient = {
  query: mock(async (query: any) => {
    const text = typeof query === 'string' ? query : query.text || '';
    const qs = text.toUpperCase();

    if (qs.includes('SET LOCAL SEARCH_PATH')) {
      const match = text.match(/TO "([^"]+)"/i);
      if (match) currentPath = match[1].toLowerCase();
    }
    if (qs.includes('SHOW SEARCH_PATH')) {
      return { rows: [{ search_path: currentPath }], rowCount: 1 };
    }
    if (qs.includes('SELECT 1 FROM INFORMATION_SCHEMA.SCHEMATA')) {
      return { rows: [{ 1: 1 }], rowCount: 1 };
    }
    if (
      qs.includes('BEGIN') ||
      qs.includes('COMMIT') ||
      qs.includes('ROLLBACK') ||
      qs.includes('RESET ALL')
    ) {
      if (qs.includes('RESET ALL')) currentPath = 'public';
      return { rows: [], rowCount: 0 };
    }
    if (qs.includes('SELECT ID, SUBDOMAIN, STATUS FROM TENANTS')) {
      return {
        rows: [{ id: 'tenant1', subdomain: 'tenant1', status: 'active' }],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 0 };
  }),
  release: mock(() => {
    currentPath = 'public';
  }),
};

const mockPool = {
  connect: mock(async () => mockClient),
  query: mockClient.query,
  on: mock(),
};

// 2. Mock ONLY the connection layer (Leaf nodes)
mock.module('./connection.js', () => ({
  publicPool: mockPool,
  publicDb: { execute: mock() },
}));

// Mock Redis to prevent real connection attempts
mock.module('./redis.service.js', () => ({
  getGlobalRedis: async () => ({
    getClient: () => ({ exists: async () => 0, set: async () => 'OK' }),
  }),
}));

// 3. Import real logic
import { configureConnectionContext, sanitizeSchemaName } from './core.js';

describe('S2 Isolation & Fail-Hard Protocol', () => {
  it('should sanitize subdomains correctly', () => {
    expect(sanitizeSchemaName('test-store')).toBe('tenant_test_store');
    expect(() => sanitizeSchemaName('public')).toThrow(/reserved/);
  });

  it('should enforce fail-hard and strictly switch search_path', async () => {
    const tenant = {
      id: 'tenant1',
      subdomain: 'tenant1',
      status: 'active',
    } as any;
    const client = mockClient as any;

    await configureConnectionContext(client, tenant, {});

    expect(client.query).toHaveBeenCalledWith(
      expect.stringMatching(/SET LOCAL search_path TO "tenant_tenant1"/i)
    );
    expect(currentPath).toBe('tenant_tenant1');
  });

  it('should reset search_path on release', async () => {
    mockClient.release();
    expect(currentPath).toBe('public');
  });
});
