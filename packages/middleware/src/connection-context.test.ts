/**
 * Tests for connection context management
 */

import { beforeEach, describe, expect, it } from 'bun:test';
import {
  getCurrentTenantContext,
  getCurrentTenantId,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
} from './connection-context';

describe('ConnectionContext', () => {
  beforeEach(() => {
    // Clear all existing context
  });

  it('should set and get tenant context', async () => {
    const mockContext: TenantContext = {
      tenantId: 'test-tenant',
      subdomain: 'test',
      plan: 'pro',
      features: [],
      createdAt: new Date(),
      schemaName: 'tenant_test-tenant',
      isActive: true,
      isSuspended: false,
    };

    await runWithTenantContext(mockContext, async () => {
      const context = getCurrentTenantContext();
      expect(context).toEqual(mockContext);
      expect(getCurrentTenantId()).toBe('test-tenant');
      expect(hasTenantContext()).toBe(true);
    });
  });

  it('should return null when no context exists', () => {
    expect(getCurrentTenantContext()).toBeNull();
    expect(getCurrentTenantId()).toBeNull();
    expect(hasTenantContext()).toBe(false);
  });

  it('should throw when requiring context without one', () => {
    expect(() => requireTenantContext()).toThrow('Tenant context required');
  });

  it('should handle nested contexts correctly', async () => {
    const outerContext: TenantContext = {
      tenantId: 'outer',
      subdomain: 'outer',
      plan: 'free',
      features: [],
      createdAt: new Date(),
      schemaName: 'tenant_outer',
      isActive: true,
      isSuspended: false,
    };

    const innerContext: TenantContext = {
      tenantId: 'inner',
      subdomain: 'inner',
      plan: 'pro',
      features: [],
      createdAt: new Date(),
      schemaName: 'tenant_inner',
      isActive: true,
      isSuspended: false,
    };

    await runWithTenantContext(outerContext, async () => {
      expect(getCurrentTenantId()).toBe('outer');

      await runWithTenantContext(innerContext, async () => {
        expect(getCurrentTenantId()).toBe('inner');
      });

      expect(getCurrentTenantId()).toBe('outer');
    });
  });
});
