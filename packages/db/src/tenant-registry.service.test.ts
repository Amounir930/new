/**
 * Tenant Registry Service Tests
 * S2 Protocol: Global Registry Access
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantRegistryService } from './tenant-registry.service.js';

// Mock DB
// 🛡️ Stabilization: Use 'mock' prefix so Vitest hoists these variables
const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
};

vi.mock('./connection.js', () => ({
    publicDb: mockDb,
}));

vi.mock('./schema.js', () => ({
    tenants: {
        id: 'id-col',
        subdomain: 'sub-col',
        name: 'name-col',
        plan: 'plan-col',
        status: 'status-col',
    },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: vi.fn().mockReturnValue('eq-mock'),
    or: vi.fn().mockReturnValue('or-mock'),
}));

describe('TenantRegistryService', () => {
    let service: TenantRegistryService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TenantRegistryService();
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
            const mockRecord = { id: 't1', subdomain: 'alpha', name: 'Alpha' };
            mockDb.limit.mockResolvedValueOnce([mockRecord]);
            const result = await service.getBySubdomain('alpha');
            expect(result).toEqual(mockRecord);
        });

        it('should return null if not found', async () => {
            mockDb.limit.mockResolvedValueOnce([]);
            const result = await service.getBySubdomain('missing');
            expect(result).toBeNull();
        });
    });

    describe('register', () => {
        it('should insert and return new tenant', async () => {
            const mockData = { subdomain: 'new', name: 'New Store', plan: 'pro' as const };
            const mockRecord = { ...mockData, id: 'uuid-new', status: 'active' };
            mockDb.returning.mockResolvedValueOnce([mockRecord]);

            const result = await service.register(mockData);
            expect(result).toEqual(mockRecord);
            expect(mockDb.insert).toHaveBeenCalled();
        });
    });
});
