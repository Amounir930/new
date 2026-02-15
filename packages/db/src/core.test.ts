import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Define mocks first
// Define mocks first
let currentPath = 'public';
const mockClientInstance = {
  connect: mock().mockResolvedValue(undefined),
  query: mock().mockImplementation(async (q) => {
    const text = (typeof q === 'string' ? q : q.text).toUpperCase();
    // console.log('Core Mock Query:', text);
    if (text.includes('SET SEARCH_PATH TO')) {
      const match = text.match(/TO "([^"]+)"/i);
      if (match) currentPath = match[1].toLowerCase();
      return { rows: [], rowCount: 0 };
    }
    if (text.includes('CURRENT_SCHEMA()')) {
      return { rows: [{ current_schema: currentPath }] };
    }
    if (text.includes('SHOW SEARCH_PATH')) {
      return { rows: [{ search_path: currentPath }] };
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
    const text = (typeof q === 'string' ? q : q.text).toUpperCase();
    if (
      text.includes('SELECT 1 FROM TENANTS') ||
      text.includes('SELECT ID, SUBDOMAIN, STATUS FROM TENANTS')
    ) {
      return {
        rows: [{ id: 'alpha-uuid', subdomain: 'alpha', status: 'active' }],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 0 };
  }),
};

import { spyOn } from 'bun:test';

// Mock connection module
mock.module('./connection.js', () => ({
  publicPool: mockPool,
  publicDb: {},
  poolConfig: { connectionString: 'postgres://localhost:5432' },
}));

// Import module
import * as coreModule from './core.js';
const { createTenantDb, verifyTenantExists, withTenantConnection, dbClientFactory } = coreModule;

// Spy on factory
spyOn(dbClientFactory, 'createClient').mockImplementation(() => mockClientInstance as any);

describe('DB Core Isolation', () => {
  beforeEach(() => {
    // Clear mocks
    mockPool.query.mockClear();
    mockPool.connect.mockClear();
    mockClientInstance.query.mockClear();
    mockClientInstance.connect.mockClear();
    mockClientInstance.end.mockClear();

    // Default behaviors
    mockClientInstance.query.mockResolvedValue({
      rows: [{ current_schema: 'tenant_alpha' }],
      rowCount: 1,
    });
  });

  describe('verifyTenantExists', () => {
    it('should return true if tenant found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
      const result = await verifyTenantExists('alpha');
      expect(result).toBe(true);
      // Bun mock calls arguments verification
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should return false if tenant not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });
      expect(await verifyTenantExists('missing')).toBe(false);
    });
  });

  describe('withTenantConnection', () => {
    it('should execute operation within tenant search_path', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'alpha-uuid', subdomain: 'alpha', status: 'active' }],
      }); // exists and active

      const operation = mock().mockResolvedValue('success');
      const result = await withTenantConnection('alpha', operation);

      expect(result).toBe('success');
      expect(mockClientInstance.query).toHaveBeenCalledWith(
        'SET search_path TO "tenant_alpha", public'
      );
      expect(mockClientInstance.end).toHaveBeenCalled();
      expect(operation).toHaveBeenCalled();
    });

    it('should enforce S2: stop if tenant not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 }); // missing
      try {
        await withTenantConnection('missing', async () => { });
        expect(true).toBe(false); // Should not reach here
      } catch (e: any) {
        expect(e.message).toContain('S2 Violation');
      }
    });

    it('should cleanup even if operation fails', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'alpha-uuid', subdomain: 'alpha', status: 'active' }],
      });
      const operation = mock().mockRejectedValue(new Error('Op Fail'));

      try {
        await withTenantConnection('alpha', operation);
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe('Op Fail');
      }
      expect(mockClientInstance.end).toHaveBeenCalled();
    });

    it('should destroy connection (end) if operation fails', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'alpha-uuid', subdomain: 'alpha', status: 'active' }],
      });
      mockClientInstance.query.mockResolvedValueOnce({}); // SET search_path

      try {
        await withTenantConnection('alpha', async () => {
          throw new Error('Op Fail');
        });
      } catch (_e) {
        // Expected
      }
      expect(mockClientInstance.end).toHaveBeenCalled();
    });
  });

  describe('createTenantDb', () => {
    it('should return a DB instance', () => {
      expect(createTenantDb('alpha')).toBeDefined();
    });
  });
});
