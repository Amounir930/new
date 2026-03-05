import { describe, expect, it } from 'bun:test';
import * as provisioning from './index';

describe('Provisioning Module Exports', () => {
  it('should export quota service functions', () => {
    expect(provisioning.isFeatureAllowed).toBeDefined();
    expect(provisioning.checkProvisioningQuota).toBeDefined();
    expect(provisioning.validateSubdomainAvailability).toBeDefined();
  });

  it('should export schema manager functions', () => {
    expect(provisioning.createTenantSchema).toBeDefined();
    expect(provisioning.dropTenantSchema).toBeDefined();
    expect(provisioning.verifySchemaExists).toBeDefined();
    expect(provisioning.listTenantSchemas).toBeDefined();
  });

  it('should export storage manager functions', () => {
    expect(provisioning.createStorageBucket).toBeDefined();
    expect(provisioning.deleteStorageBucket).toBeDefined();
    expect(provisioning.getStorageStats).toBeDefined();
    expect(provisioning.getSignedUploadUrl).toBeDefined();
  });
});
