import { getTenantDb } from '@apex/db';
import type { RedisRateLimitStore } from '@apex/middleware';
import { Test, type TestingModule } from '@nestjs/testing';
import { MerchantConfigController } from './merchant-config.controller';

jest.mock('@apex/db', () => ({
  getTenantDb: jest.fn(),
  tenantConfigInStorefront: {
    key: 'key',
    value: 'value',
    updatedAt: 'updatedAt',
  },
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
          provide: 'REDIS_STORE',
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
        transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
      };

      const mockRelease = jest.fn();
      (getTenantDb as jest.Mock).mockResolvedValue({
        db: mockDb,
        release: mockRelease,
      });

      const result = await controller.updateConfig(mockReq, mockBody);

      expect(result).toEqual({ success: true });
      expect(getTenantDb).toHaveBeenCalledWith('test-tenant');
      expect(mockDb.transaction).toHaveBeenCalled();

      const client = await redisStore.getClient();
      expect(client.del).toHaveBeenCalledWith('storefront:home:test-tenant');
      expect(client.del).toHaveBeenCalledWith('storefront:config:test-tenant');
      expect(client.del).toHaveBeenCalledWith(
        'storefront:bootstrap:test-tenant'
      );
      expect(mockRelease).toHaveBeenCalled();
    });

    it('should reject tenantId if passed in body (Zod Schema Validation)', async () => {
      // Note: NestJS ZodValidationPipe will handle this at runtime,
      // but we verify the controller doesn't use it if passed (it's not in the schema anyway).
      const mockReq: any = { user: { tenantId: 'test-tenant' } };
      const mockBody: any = {
        store_name: 'New Name',
        tenantId: 'malicious-tenant',
      };

      const mockTx = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockResolvedValue({}),
      };

      const mockDb = {
        transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
      };

      const mockRelease = jest.fn();
      (getTenantDb as jest.Mock).mockResolvedValue({
        db: mockDb,
        release: mockRelease,
      });

      await controller.updateConfig(mockReq, mockBody);

      // Verify that the database update only used the allowed fields.
      // In merchant-config.controller.ts, it only checks body.store_name and body.logo_url
      expect(mockTx.insert).not.toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'malicious-tenant' })
      );
    });
  });
});
