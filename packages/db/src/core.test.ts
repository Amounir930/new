/**
 * Core DB Isolation Tests
 * S2 Protocol: Tenant Isolation via search_path
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTenantDb,
  verifyTenantExists,
  withTenantConnection,
} from './core.js';

// Mock connection
// 🛡️ Stabilization: Use 'mock' prefix so Vitest hoists these variables
const mockPool = {
  query: vi.fn(),
  connect: vi.fn(),
};
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

vi.mock('./connection.js', () => ({
  publicPool: mockPool,
  publicDb: {},
}));

describe('DB Core Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.connect.mockResolvedValue(mockClient);
  });

  describe('verifyTenantExists', () => {
    it('should return true if tenant found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
      const result = await verifyTenantExists('alpha');
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM tenants'),
        ['alpha']
      );
    });

    it('should return false if tenant not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });
      expect(await verifyTenantExists('missing')).toBe(false);
    });
  });

  describe('withTenantConnection', () => {
    it('should execute operation within tenant search_path', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // exists
      mockClient.query.mockResolvedValue({}); // SET, RESET

      const operation = vi.fn().mockResolvedValue('success');
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
      await expect(
        withTenantConnection('missing', async () => {})
      ).rejects.toThrow('S2 Violation');
    });

    it('should cleanup even if operation fails', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
      const operation = vi.fn().mockRejectedValue(new Error('Op Fail'));

      await expect(withTenantConnection('alpha', operation)).rejects.toThrow(
        'Op Fail'
      );
      expect(mockClient.query).toHaveBeenCalledWith('RESET search_path');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should destroy connection (release true) if cleanup fails', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
      mockClient.query.mockResolvedValueOnce({}); // SET search_path
      mockClient.query.mockRejectedValueOnce(new Error('Reset Fail 1')); // RESET in try
      mockClient.query.mockRejectedValueOnce(new Error('Reset Fail 2')); // RESET in catch

      await expect(
        withTenantConnection('alpha', async () => {})
      ).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalledWith(true);
    });
  });

  describe('createTenantDb', () => {
    it('should return a DB instance', () => {
      expect(createTenantDb('alpha')).toBeDefined();
    });
  });
});
