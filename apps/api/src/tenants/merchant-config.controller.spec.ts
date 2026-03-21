import { adminDb, getTenantDb } from '@apex/db';
import { RedisRateLimitStore } from '@apex/middleware';
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { MerchantConfigController } from './merchant-config.controller';

jest.mock('@apex/db', () => ({
  getTenantDb: jest.fn(),
  adminDb: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([{ subdomain: 'test-sub' }]),
  },
  tenantsInGovernance: {
    id: 'id',
    subdomain: 'subdomain',
  },
  tenantConfigInStorefront: {
    key: { name: 'key' },
  },
  eq: jest.fn(),
}));

describe('MerchantConfigController', () => {
  let controller: MerchantConfigController;
  let redisStore: any;

  beforeEach(async () => {
    redisStore = {
      getClient: jest.fn().mockResolvedValue({
        del: jest.fn().mockResolvedValue(1),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantConfigController],
      providers: [
        {
          provide: RedisRateLimitStore,
          useValue: redisStore,
        },
      ],
    }).compile();

    controller = module.get<MerchantConfigController>(MerchantConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateConfig', () => {
    it('should surgicaly invalidate cache and update db', async () => {
      const mockReq: any = { user: { tenantId: 'test-tenant' } };
      const mockBody = { store_name: 'New Name', logo_url: 'https://logo.png' };

      const mockTx = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockResolvedValue({}),
      };

      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
      };

      const mockRelease = jest.fn();
      (getTenantDb as jest.Mock).mockResolvedValue({
        db: mockDb,
        release: mockRelease,
      });

      const result = await controller.updateConfig(mockReq, mockBody);

      expect(result).toEqual({ success: true });
      expect(adminDb.select).toHaveBeenCalled();
      expect(getTenantDb).toHaveBeenCalledWith(
        'test-tenant',
        'tenant_test-sub'
      );
      expect(mockDb.transaction).toHaveBeenCalled();

      const client = await redisStore.getClient();
      expect(client.del).toHaveBeenCalledWith('storefront:home:test-tenant');
      expect(client.del).toHaveBeenCalledWith('storefront:config:test-tenant');
      expect(client.del).toHaveBeenCalledWith(
        'storefront:bootstrap:test-tenant'
      );
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant is missing in governance', async () => {
      (adminDb.limit as jest.Mock).mockResolvedValueOnce([]);
      const mockReq: any = { user: { tenantId: 'test-tenant' } };

      await expect(controller.getConfig(mockReq)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
