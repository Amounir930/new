import { describe, expect, it, mock } from 'bun:test';

// Mock config and db before importing index
mock.module('@apex/config', () => ({
  env: {
    APP_ROOT_DOMAIN: 'apex.localhost',
    INTERNAL_API_SECRET: 'test-secret',
  },
}));

mock.module('@apex/db', () => ({
  adminDb: {
    select: mock().mockReturnThis(),
    from: mock().mockReturnThis(),
    where: mock().mockReturnThis(),
    limit: mock().mockResolvedValue([]),
  },
  adminPool: {
    connect: mock().mockResolvedValue({
      query: mock().mockResolvedValue(undefined),
      release: mock(),
    }),
  },
  tenantsInGovernance: {},
  eq: mock(),
}));

import {
  getCurrentTenantContext,
  getCurrentTenantId,
  getTenantContext,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  tenantStorage,
} from './index';

describe('Middleware Module Exports', () => {
  it('should export getCurrentTenantContext', () => {
    expect(getCurrentTenantContext).toBeDefined();
  });

  it('should export getCurrentTenantId', () => {
    expect(getCurrentTenantId).toBeDefined();
  });

  it('should export getTenantContext', () => {
    expect(getTenantContext).toBeDefined();
  });

  it('should export hasTenantContext', () => {
    expect(hasTenantContext).toBeDefined();
  });

  it('should export requireTenantContext', () => {
    expect(requireTenantContext).toBeDefined();
  });

  it('should export runWithTenantContext', () => {
    expect(runWithTenantContext).toBeDefined();
  });

  it('should export tenantStorage', () => {
    expect(tenantStorage).toBeDefined();
  });
});
