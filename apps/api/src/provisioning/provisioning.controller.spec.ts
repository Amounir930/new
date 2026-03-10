import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { AuditService } from '@apex/audit';
import type { AuthenticatedRequest } from '@apex/auth';
import { MockFactory } from '@apex/test-utils';
import type { ProvisionRequestDto } from './dto/provision-request.dto';
import { ProvisioningController } from './provisioning.controller';
import type { ProvisioningService } from './provisioning.service';

describe('ProvisioningController', () => {
  let controller: ProvisioningController;
  let service: ProvisioningService;

  const provServiceMock = {
    provision: mock(),
  };
  const isProvService = (s: unknown): s is Mocked<ProvisioningService> => true;
  const mockProvisioningService = isProvService(provServiceMock)
    ? provServiceMock
    : (() => {
        throw new Error('Unreachable');
      })();

  const auditServiceMock = {
    log: mock(),
  };
  const isAuditService = (s: unknown): s is Mocked<AuditService> => true;
  const mockAuditService = isAuditService(auditServiceMock)
    ? auditServiceMock
    : (() => {
        throw new Error('Unreachable');
      })();

  beforeEach(async () => {
    // Manual instantiation to bypass NestJS TestingModule issues with Bun
    controller = new ProvisioningController(
      mockProvisioningService,
      mockAuditService
    );
    service = mockProvisioningService;

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
        success: true,
        subdomain: 'test-store',
        durationMs: 1500,
        adminId: 'admin-123',
      });

      const authReq = {};
      const isAuthReq = (r: unknown): r is AuthenticatedRequest => true;
      const isDto = (d: unknown): d is ProvisionRequestDto => true;

      const result = await controller.provisionStore(
        isAuthReq(authReq) ? authReq : (authReq as AuthenticatedRequest),
        isDto(validDto) ? validDto : (validDto as ProvisionRequestDto)
      );

      expect(result.message).toBe('Store provisioned successfully');
      expect(result.data.subdomain).toBe('test-store');
      expect(service.provision).toHaveBeenCalled();
    });

    it('should handle provisioning errors', async () => {
      mockProvisioningService.provision.mockRejectedValue(
        new Error('Provisioning failed')
      );

      const authReq = {};
      const isAuthReq = (r: unknown): r is AuthenticatedRequest => true;
      const isDto = (d: unknown): d is ProvisionRequestDto => true;

      await expect(
        controller.provisionStore(
          isAuthReq(authReq) ? authReq : (authReq as AuthenticatedRequest),
          isDto(validDto) ? validDto : (validDto as ProvisionRequestDto)
        )
      ).rejects.toThrow('Provisioning failed');
    });
  });
});
