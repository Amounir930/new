import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { AuditService } from '@apex/audit';
import * as provisioning from '@apex/provisioning';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  type ProvisioningOptions,
  ProvisioningService,
} from './provisioning.service.js';

// Mock the @apex/provisioning module
mock.module('@apex/provisioning', () => ({
  createTenantSchema: mock(),
  runTenantMigrations: mock(),
  createStorageBucket: mock(),
  seedTenantData: mock(),
  dropTenantSchema: mock(),
}));

// Mock @apex/db
mock.module('@apex/db', () => {
  return {
    TenantRegistryService: class TenantRegistryService {
      register = mock();
      existsBySubdomain = mock().mockResolvedValue(false);
    },
    publicDb: {
      select: mock().mockReturnThis(),
      from: mock().mockReturnThis(),
      where: mock().mockReturnThis(),
      limit: mock().mockImplementation(() => Promise.resolve([])),
      insert: mock().mockReturnThis(),
      values: mock().mockReturnThis(),
      onConflictDoNothing: mock().mockImplementation(() => Promise.resolve([])),
      execute: mock().mockResolvedValue([]),
    },
    tenants: { subdomain: 'subdomain', id: 'id' },
    onboardingBlueprints: {
      id: 'id',
      blueprint: 'blueprint',
      status: 'status',
      nicheType: 'nicheType',
      plan: 'plan',
    },
    featureGates: {},
    tenantQuotas: {},
    eq: mock(),
    and: mock(),
    sql: mock(),
  };
});

// Mock @apex/config
mock.module('@apex/config', () => ({
  env: {
    APP_ROOT_DOMAIN: 'apex.localhost',
    NODE_ENV: 'test',
  },
}));

describe('ProvisioningService', () => {
  let service: ProvisioningService;

  const mockAuditService = {
    log: mock(),
  };

  const mockTenantRegistry = {
    register: mock(),
    existsBySubdomain: mock().mockResolvedValue(false),
  };

  const options: ProvisioningOptions = {
    subdomain: 'test-store',
    adminEmail: 'admin@test.com',
    storeName: 'Test Store',
    plan: 'basic',
  };

  beforeEach(async () => {
    mockAuditService.log.mockClear();
    mockTenantRegistry.register.mockClear();
    mockTenantRegistry.existsBySubdomain.mockClear();

    // Reset all provisioning mocks
    (provisioning.createTenantSchema as any).mockReset();
    (provisioning.runTenantMigrations as any).mockReset();
    (provisioning.createStorageBucket as any).mockReset();
    (provisioning.seedTenantData as any).mockReset();
    (provisioning.dropTenantSchema as any).mockReset();

    // Manual instantiation to bypass NestJS DI issues with Bun/swc
    service = new ProvisioningService(
      mockAuditService as any,
      mockTenantRegistry as any
    );
  });

  describe('provision', () => {
    it('should successfully provision a store', async () => {
      (provisioning.createTenantSchema as any).mockResolvedValue(undefined);
      (provisioning.runTenantMigrations as any).mockResolvedValue(undefined);
      (provisioning.createStorageBucket as any).mockResolvedValue(undefined);
      (provisioning.seedTenantData as any).mockResolvedValue({
        adminId: 'admin-123',
      });

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
      expect(mockTenantRegistry.register).toHaveBeenCalled();
      expect(provisioning.seedTenantData).toHaveBeenCalledWith(
        expect.objectContaining({
          subdomain: 'test-store',
          adminEmail: 'admin@test.com',
          storeName: 'Test Store',
          plan: 'basic',
        })
      );
    });

    it('should throw ConflictException if resource already exists', async () => {
      (provisioning.createTenantSchema as any).mockRejectedValue(
        new Error('schema "tenant_test-store" already exists')
      );

      await expect(service.provision(options)).rejects.toThrow(
        ConflictException
      );
      expect(provisioning.dropTenantSchema).not.toHaveBeenCalled();
    });

    it('should rollback and throw InternalServerErrorException on step failure', async () => {
      // Step 0 succeeds
      (provisioning.createTenantSchema as any).mockResolvedValue(undefined);
      // Step 1 fails
      (provisioning.runTenantMigrations as any).mockRejectedValue(
        new Error('Migration failed')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );

      // Rollback should be called for step 0
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });

    it('should handle rollback failure gracefully', async () => {
      (provisioning.createTenantSchema as any).mockResolvedValue(undefined);
      (provisioning.runTenantMigrations as any).mockRejectedValue(
        new Error('Fail')
      );
      (provisioning.dropTenantSchema as any).mockRejectedValue(
        new Error('Rollback Fail')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should proceed with rollback if multiple steps succeeded before failure', async () => {
      (provisioning.createTenantSchema as any).mockResolvedValue(undefined);
      (provisioning.runTenantMigrations as any).mockResolvedValue(undefined);
      (provisioning.createStorageBucket as any).mockRejectedValue(
        new Error('Bucket Fail')
      );

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });

    it('should throw InternalServerErrorException if seeding fails', async () => {
      (provisioning.createTenantSchema as any).mockResolvedValue(undefined);
      (provisioning.runTenantMigrations as any).mockResolvedValue(undefined);
      (provisioning.createStorageBucket as any).mockResolvedValue(undefined);
      (provisioning.seedTenantData as any).mockRejectedValue(
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
      (provisioning.createTenantSchema as any).mockResolvedValue(undefined);
      (provisioning.runTenantMigrations as any).mockResolvedValue(undefined);
      (provisioning.createStorageBucket as any).mockResolvedValue(undefined);
      (provisioning.seedTenantData as any).mockResolvedValue({
        adminId: 'admin-123',
      });

      mockTenantRegistry.register.mockRejectedValue(new Error('Registry Fail'));

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('Non-Standard Errors', () => {
    it('should handle non-Error objects thrown during provisioning', async () => {
      (provisioning.createTenantSchema as any).mockRejectedValue(
        'String Error'
      );

      await expect(service.provision(options)).rejects.toThrow(
        'Provisioning Failed: Unknown'
      );
    });
  });
});
