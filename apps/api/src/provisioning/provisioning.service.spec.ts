import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { AuditService } from '@apex/audit';
import * as provisioning from '@apex/provisioning';
import { MockFactory } from '@apex/test-utils';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  type ProvisioningOptions,
  ProvisioningService,
} from './provisioning.service';

// Mock the @apex/provisioning module
mock.module('@apex/provisioning', () => ({
  createTenantSchema: mock(),
  runTenantMigrations: mock(),
  createStorageBucket: mock(),
  seedTenantData: mock(),
  dropTenantSchema: mock(),
}));

// Mock @apex/db
const adminDb = {
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  limit: mock().mockImplementation(() => Promise.resolve([])),
  execute: mock().mockResolvedValue([]),
  insert: mock().mockReturnThis(),
  values: mock().mockImplementation(() => Promise.resolve([])),
};

const publicDb = {
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  limit: mock().mockImplementation(() => Promise.resolve([])),
  insert: mock().mockReturnThis(),
  values: mock().mockReturnThis(),
  onConflictDoNothing: mock().mockImplementation(() => Promise.resolve([])),
  execute: mock().mockResolvedValue([]),
};

mock.module('@apex/db', () => ({
  adminDb,
  publicDb,
  tenantsInGovernance: { id: 'id', ownerEmail: 'ownerEmail' },
  onboardingBlueprintsInGovernance: {
    id: 'id',
    blueprint: 'blueprint',
    status: 'status',
    nicheType: 'nicheType',
    plan: 'plan',
  },
  tenantQuotasInGovernance: {
    tenantId: 'tenantId',
    maxProducts: 'maxProducts',
    maxOrders: 'maxOrders',
    maxPages: 'maxPages',
    maxStaff: 'maxStaff',
    storageLimitGb: 'storageLimitGb',
  },
  featureGatesInGovernance: {},
  eq: mock(),
  and: mock(),
  sql: mock().mockReturnValue({}),
}));

// Mock @apex/config
mock.module('@apex/config', () => ({
  env: {
    APP_ROOT_DOMAIN: 'apex.localhost',
    NODE_ENV: 'test',
  },
}));

describe('ProvisioningService', () => {
  let service: ProvisioningService;

  const mockAuditService = MockFactory.createAuditService();

  const options: ProvisioningOptions = {
    subdomain: 'test-store',
    adminEmail: 'admin@test.com',
    storeName: 'Test Store',
    plan: 'basic',
  };

  beforeEach(async () => {
    adminDb.insert.mockClear();
    adminDb.values.mockClear();
    adminDb.limit.mockClear();
    adminDb.select.mockClear();

    // Reset all provisioning mocks
    (provisioning.createTenantSchema as ReturnType<typeof mock>).mockReset();
    (provisioning.runTenantMigrations as ReturnType<typeof mock>).mockReset();
    (provisioning.createStorageBucket as ReturnType<typeof mock>).mockReset();
    (provisioning.seedTenantData as ReturnType<typeof mock>).mockReset();
    (
      provisioning.dropTenantSchema as ReturnType<typeof mock>
    ).mockRejectedValue(new Error('Rollback Fail'));

    // Manual instantiation to bypass NestJS DI issues with Bun/swc
    service = new ProvisioningService(mockAuditService as AuditService);
  });

  describe('provision', () => {
    it('should successfully provision a store', async () => {
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.runTenantMigrations as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.createStorageBucket as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.seedTenantData as ReturnType<typeof mock>
      ).mockResolvedValue({
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
      expect(adminDb.insert).toHaveBeenCalledWith(expect.anything());
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
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockRejectedValue(
        new Error('schema "tenant_test-store" already exists')
      );

      await expect(service.provision(options)).rejects.toThrow(
        ConflictException
      );
      expect(provisioning.dropTenantSchema).not.toHaveBeenCalled();
    });

    it('should rollback and throw InternalServerErrorException on step failure', async () => {
      // Step 0 succeeds
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      // Step 1 fails
      (
        provisioning.runTenantMigrations as ReturnType<typeof mock>
      ).mockRejectedValue(new Error('Migration failed'));

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );

      // Rollback should be called for step 0
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });

    it('should handle rollback failure gracefully', async () => {
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.runTenantMigrations as ReturnType<typeof mock>
      ).mockRejectedValue(new Error('Fail'));
      (
        provisioning.dropTenantSchema as ReturnType<typeof mock>
      ).mockRejectedValue(new Error('Rollback Fail'));

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should proceed with rollback if multiple steps succeeded before failure', async () => {
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.runTenantMigrations as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.createStorageBucket as ReturnType<typeof mock>
      ).mockRejectedValue(new Error('Bucket Fail'));

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });

    it('should throw InternalServerErrorException if seeding fails', async () => {
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.runTenantMigrations as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.createStorageBucket as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.seedTenantData as ReturnType<typeof mock>
      ).mockRejectedValue(new Error('Seed Fail'));

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(provisioning.dropTenantSchema).toHaveBeenCalledWith('test-store');
    });
  });

  describe('registerTenant', () => {
    it('should throw InternalServerErrorException if registry fails', async () => {
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.runTenantMigrations as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.createStorageBucket as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);
      (
        provisioning.seedTenantData as ReturnType<typeof mock>
      ).mockResolvedValue({
        adminId: 'admin-123',
      });

      (adminDb.insert as ReturnType<typeof mock>).mockReturnValue({
        values: mock().mockRejectedValue(new Error('Registry Fail')),
      });

      await expect(service.provision(options)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('Non-Standard Errors', () => {
    it('should handle non-Error objects thrown during provisioning', async () => {
      (
        provisioning.createTenantSchema as ReturnType<typeof mock>
      ).mockRejectedValue('String Error');

      await expect(service.provision(options)).rejects.toThrow(
        'Provisioning Failed: Unknown'
      );
    });
  });
});
