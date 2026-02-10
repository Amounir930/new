/**
 * Tenant Data Seeder Tests
 * S2 Protocol: Tenant Data Isolation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedTenantData, isSeeded } from './seeder.js';

// Mock DB
// 🛡️ Stabilization: Use 'mock' prefix so Vitest hoists these variables
const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
};

vi.mock('@apex/db', () => ({
    createTenantDb: vi.fn().mockReturnValue(mockDb),
    users: { id: 'users.id' },
    stores: { id: 'stores.id' },
    settings: { key: 'settings.key', value: 'settings.value' },
}));

describe('seedTenantData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should seed store, admin and settings', async () => {
        const options = {
            subdomain: 'beta',
            storeName: 'Beta Store',
            adminEmail: 'b@test.com',
        };

        const result = await seedTenantData(options);

        expect(result.adminId).toBe('mock-id');
        expect(result.storeId).toBe('mock-id');
        expect(mockDb.insert).toHaveBeenCalledTimes(3); // Stores, Users, Settings
        expect(mockDb.values).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ key: 'site_name', value: 'Beta Store' })
        ]));
    });

    it('should throw Seeding Failure if DB fails', async () => {
        mockDb.returning.mockRejectedValueOnce(new Error('DB Timeout'));
        await expect(seedTenantData({ subdomain: 'x', storeName: 'X', adminEmail: 'x@x.com' }))
            .rejects.toThrow('Seeding Failure: DB Timeout');
    });
});

describe('isSeeded', () => {
    it('should return true if count > 0', async () => {
        mockDb.from.mockResolvedValueOnce([{ count: '1' }]);
        const result = await isSeeded('alpha');
        expect(result).toBe(true);
    });

    it('should return false if count is 0', async () => {
        mockDb.from.mockResolvedValueOnce([{ count: '0' }]);
        const result = await isSeeded('empty');
        expect(result).toBe(false);
    });

    it('should return false if query fails', async () => {
        mockDb.from.mockRejectedValueOnce(new Error('Table missing'));
        const result = await isSeeded('fail');
        expect(result).toBe(false);
    });
});
