import { AuditService } from '@apex/audit';
import { TenantRegistryService } from '@apex/db';
import * as provisioning from '@apex/provisioning';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ProvisioningOptions,
  ProvisioningService,
} from './provisioning.service.js';

// Mock the @apex/provisioning module
vi.mock('@apex/provisioning', () => ({
  createTenantSchema: vi.fn(),
  runTenantMigrations: vi.fn(),
  createStorageBucket: vi.fn(),
  seedTenantData: vi.fn(),
  dropTenantSchema: vi.fn(),
}));

// Mock @apex/db
vi.mock('@apex/db', () => ({
  TenantRegistryService: vi.fn().mockImplementation(() => ({
    register: vi.fn(),
  })),
}));

describe('ProvisioningService', () => {
  let service: ProvisioningService;
  let _audit: AuditService;

  const mockAuditService = {
    log: vi.fn(),
  };

  const options: ProvisioningOptions = {
    subdomain: 'test-store',
    adminEmail: 'admin@test.com',
    storeName: 'Test Store',
    plan: 'basic',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockTenantRegistry = {
      register: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvisioningService,
        {
          provide: 'AUDIT_SERVICE',
          useValue: mockAuditService,
        },
        {
          provide: TenantRegistryService,
          useValue: mockTenantRegistry,
        },
      ],
    }).compile();

    service = module.get<ProvisioningService>(ProvisioningService);
    _audit = module.get<AuditService>('AUDIT_SERVICE');
    (service as any).tenantRegistry = mockTenantRegistry; // Force override just in case
  });

  describe('provision', () => {
    it('should successfully provision a store', async () => {
      vi.mocked(provisioning.createTenantSchema).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.runTenantMigrations).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.createStorageBucket).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.seedTenantData).mockResolvedValue({
        adminId: 'admin-123',
      } as any);

      const result = await service.provision(options);

      expect(result.success).toBe(true);
      expect(result.subdomain).toBe('test-store');
      expect(result.adminId).toBe('admin-123');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STORE_PROVISIONED',
          entityId: 'test-store',
        })
      );
      expect((service as any).tenantRegistry.register).toHaveBeenCalled();
    });

    it('should throw ConflictException if resource already exists', async () => {
      vi.mocked(provisioning.createTenantSchema).mockRejectedValue(
        new Error('schema "tenant_test-store" already exists')
      );

      await expect(service.provision(options)).rejects.toThrow(
        ConflictException
      );
      expect(provisioning.dropTenantSchema).not.toHaveBeenCalled();
    });

    it('should rollback and throw InternalServerErrorException on step failure', async () => {
      // Step 0 succeeds
      vi.mocked(provisioning.createTenantSchema).mockResolvedValue(
        undefined as any
      );
      // Step 1 fails
      vi.mocked(provisioning.runTenantMigrations).mockRejectedValue(
        new Error('Migration failed')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );

      // Rollback should be called for step 0
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });

    it('should handle rollback failure gracefully', async () => {
      vi.mocked(provisioning.createTenantSchema).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.runTenantMigrations).mockRejectedValue(
        new Error('Fail')
      );
      vi.mocked(provisioning.dropTenantSchema).mockRejectedValue(
        new Error('Rollback Fail')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
      // Even if dropTenantSchema fails, InternalServerErrorException should still be thrown for the original error
    });

    it('should proceed with rollback if multiple steps succeeded before failure', async () => {
      vi.mocked(provisioning.createTenantSchema).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.runTenantMigrations).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.createStorageBucket).mockRejectedValue(
        new Error('Bucket Fail')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });

    it('should throw InternalServerErrorException if seeding fails', async () => {
      vi.mocked(provisioning.createTenantSchema).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.runTenantMigrations).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.createStorageBucket).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.seedTenantData).mockRejectedValue(
        new Error('Seed Fail')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });
  });

  describe('registerTenant', () => {
    it('should throw InternalServerErrorException if registry fails', async () => {
      vi.mocked(provisioning.createTenantSchema).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.runTenantMigrations).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.createStorageBucket).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.seedTenantData).mockResolvedValue({
        adminId: 'admin-123',
      } as any);

      const mockTenantRegistry = (service as any).tenantRegistry;
      mockTenantRegistry.register.mockRejectedValue(new Error('Registry Fail'));

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });
  describe('Logger & Non-Standard Errors', () => {
    it('should log error when rollback fails', async () => {
      const loggerSpy = vi.spyOn(Logger.prototype, 'error');

      vi.mocked(provisioning.createTenantSchema).mockResolvedValue(
        undefined as any
      );
      vi.mocked(provisioning.runTenantMigrations).mockRejectedValue(
        new Error('Migrate Fail')
      );
      vi.mocked(provisioning.dropTenantSchema).mockRejectedValue(
        new Error('Drop Fail')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rollback FAILED'),
        expect.any(Error)
      );
    });

    it('should handle non-Error objects thrown during provisioning', async () => {
      vi.mocked(provisioning.createTenantSchema).mockRejectedValue(
        'String Error'
      );

      await expect(service.provision(options)).rejects.toThrow(
        'Provisioning Failed: Unknown'
      );
    });
  });
});
