import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ProvisioningController } from './provisioning.controller.js';
import type { ProvisioningService } from './provisioning.service.js';

describe('ProvisioningController', () => {
  let controller: ProvisioningController;
  let service: ProvisioningService;

  const mockProvisioningService = {
    provision: mock(),
  };

  const mockAuditService = {
    log: mock(),
  };

  beforeEach(async () => {
    // Manual instantiation to bypass NestJS TestingModule issues with Bun
    controller = new ProvisioningController(
      mockProvisioningService as never,
      mockAuditService as never
    );
    service = mockProvisioningService as never;

    mockProvisioningService.provision.mockClear();
    mockAuditService.log.mockClear();
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

      const result = await controller.provisionStore(
        {} as never,
        validDto as never
      );

      expect(result.message).toBe('Store provisioned successfully');
      expect(result.data.subdomain).toBe('test-store');
      expect(service.provision).toHaveBeenCalled();
    });

    it('should handle provisioning errors', async () => {
      mockProvisioningService.provision.mockRejectedValue(
        new Error('Provisioning failed')
      );

      await expect(
        controller.provisionStore({} as never, validDto as never)
      ).rejects.toThrow('Provisioning failed');
    });
  });
});
