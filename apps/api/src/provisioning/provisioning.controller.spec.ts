import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProvisioningController } from './provisioning.controller.js';
import type { ProvisioningService } from './provisioning.service.js';

describe('ProvisioningController', () => {
  let controller: ProvisioningController;
  let service: ProvisioningService;

  const mockProvisioningService = {
    provision: vi.fn(),
  };

  const mockAuditService = {
    log: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvisioningController],
      providers: [
        {
          provide: 'PROVISIONING_SERVICE',
          useValue: mockProvisioningService,
        },
        {
          provide: 'AUDIT_SERVICE',
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<ProvisioningController>(ProvisioningController);
    service = module.get<ProvisioningService>('PROVISIONING_SERVICE');

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('provisionStore', () => {
    const validDto = {
      subdomain: 'test-store',
      storeName: 'Test Store',
      adminEmail: 'admin@test.com',
      plan: 'basic' as const,
      superAdminKey: 'valid-key',
    };

    it('should provision with valid data', async () => {
      mockProvisioningService.provision.mockResolvedValue({
        subdomain: 'test-store',
        durationMs: 1500,
      });

      const result = await controller.provisionStore(validDto as any);

      expect(result.message).toBe('Store provisioned successfully');
      expect(result.data.subdomain).toBe('test-store');
      expect(service.provision).toHaveBeenCalled();
    });

    it('should handle provisioning errors', async () => {
      mockProvisioningService.provision.mockRejectedValue(
        new Error('Provisioning failed')
      );

      await expect(controller.provisionStore(validDto as any)).rejects.toThrow(
        'Provisioning failed'
      );
    });
  });
});
