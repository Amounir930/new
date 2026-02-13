import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Define mocks first
const mockPool = {
  query: mock(),
  connect: mock(),
};
const mockClient = {
  query: mock(),
  release: mock(),
};

// Mock the connection module
mock.module('./connection.js', () => ({
  publicPool: mockPool,
  publicDb: {},
}));

// Import module AFTER mocking
const { createTenantDb, verifyTenantExists, withTenantConnection } =
  await import('./core.js');

describe('DB Core Isolation', () => {
  beforeEach(() => {
    // Clear mocks
    mockPool.query.mockClear();
    mockPool.connect.mockClear();
    mockClient.query.mockClear();
    mockClient.release.mockClear();

    // Default behaviors
    mockPool.connect.mockResolvedValue(mockClient);
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
        rows: [{ id: 'alpha-uuid', subdomain: 'alpha' }],
      }); // exists
      mockClient.query.mockResolvedValue({}); // SET, RESET

      const operation = mock().mockResolvedValue('success');
      const result = await withTenantConnection('alpha', operation);

      expect(result).toBe('success');
      expect(mockClient.query).toHaveBeenCalledWith(
        'SET search_path TO "tenant_alpha", public'
      );
      expect(mockClient.query).toHaveBeenCalledWith('RESET search_path');
      expect(mockClient.release).toHaveBeenCalled();
      expect(operation).toHaveBeenCalled();
    });

    it('should enforce S2: stop if tenant not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 }); // missing
      try {
        await withTenantConnection('missing', async () => {});
        expect(true).toBe(false); // Should not reach here
      } catch (e: any) {
        expect(e.message).toContain('S2 Violation');
      }
    });

    it('should cleanup even if operation fails', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'alpha-uuid', subdomain: 'alpha' }],
      });
      const operation = mock().mockRejectedValue(new Error('Op Fail'));

      try {
        await withTenantConnection('alpha', operation);
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e.message).toBe('Op Fail');
      }
      expect(mockClient.query).toHaveBeenCalledWith('RESET search_path');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should destroy connection (release true) if cleanup fails', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'alpha-uuid', subdomain: 'alpha' }],
      });
      mockClient.query.mockResolvedValueOnce({}); // SET search_path
      mockClient.query.mockRejectedValueOnce(new Error('Reset Fail 1')); // RESET in try
      mockClient.query.mockRejectedValueOnce(new Error('Reset Fail 2')); // RESET in catch

      try {
        await withTenantConnection('alpha', async () => {});
      } catch (_e) {
        // Expected to throw
      }
      expect(mockClient.release).toHaveBeenCalledWith(true);
    });
  });

  describe('createTenantDb', () => {
    it('should return a DB instance', () => {
      expect(createTenantDb('alpha')).toBeDefined();
    });
  });
});
