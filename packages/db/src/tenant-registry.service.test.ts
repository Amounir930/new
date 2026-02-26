/**
 * Tenant Registry Service Tests
 * S2 Protocol: Global Registry Access
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { TenantRegistryService } from './tenant-registry.service.js';

// Define mocks
const mockDb = {
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  limit: mock().mockResolvedValue([]),
  insert: mock().mockReturnThis(),
  values: mock().mockReturnThis(),
  returning: mock().mockResolvedValue([]),
};

// Mock connection
mock.module('./connection.js', () => ({
  publicDb: mockDb,
}));

// Mock schema
mock.module('./schema.js', () => ({
  tenants: {
    id: 'id-col',
    subdomain: 'sub-col',
    name: 'name-col',
    plan: 'plan-col',
    status: 'status-col',
  },
}));

// Mock drizzle-orm
mock.module('drizzle-orm', () => ({
  eq: mock().mockReturnValue('eq-mock'),
  or: mock().mockReturnValue('or-mock'),
  desc: mock().mockReturnValue('desc-mock'),
}));

describe('TenantRegistryService', () => {
  let service: TenantRegistryService;

  beforeEach(() => {
    // Clear mocks
    mockDb.limit.mockClear();
    mockDb.returning.mockClear();
    mockDb.insert.mockClear();
    mockDb.select.mockClear();

    service = new TenantRegistryService({
      encrypt: (v: any) => ({ encrypted: v, iv: 'iv', tag: 'tag' }),
      decrypt: (v: any) => (typeof v === 'string' ? v : v.encrypted),
    } as any);
  });

  describe('exists', () => {
    it('should return true if record found', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 't1' }]);
      const result = await service.exists('test-id');
      expect(result).toBe(true);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return false if record not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      const result = await service.exists('missing');
      expect(result).toBe(false);
    });
  });

  describe('getBySubdomain', () => {
    it('should return tenant record if found', async () => {
      const mockRecord = {
        id: 't1',
        subdomain: 'alpha',
        name: 'Alpha',
        status: 'active',
      };
      mockDb.limit.mockResolvedValueOnce([mockRecord]);
      const result = await service.getBySubdomain('alpha');
      expect(result).toEqual(
        expect.objectContaining({ id: 't1', subdomain: 'alpha' })
      );
    });

    it('should return null if not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      const result = await service.getBySubdomain('missing');
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should insert and return new tenant', async () => {
      const mockData = {
        subdomain: 'new',
        name: 'New Store',
        plan: 'pro' as const,
        nicheType: 'retail',
        uiConfig: {},
      };
      const mockRecord = { ...mockData, id: 'uuid-new', status: 'active' };
      mockDb.returning.mockResolvedValueOnce([mockRecord]);

      const result = await service.register(mockData as any);
      expect(result).toEqual(
        expect.objectContaining({ id: 'uuid-new', subdomain: 'new' })
      );
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
