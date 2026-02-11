/**
 * Tests for connection context management
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  type TenantContext,
  getCurrentTenantContext,
  getCurrentTenantId,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
} from './connection-context.js';

describe('ConnectionContext', () => {
  beforeEach(() => {
    // Clear any existing context
  });

  it('should set and get tenant context', async () => {
    const mockContext: TenantContext = {
      tenantId: 'test-tenant',
      subdomain: 'test',
      plan: 'pro',
      features: [],
      createdAt: new Date(),
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
    };

    const innerContext: TenantContext = {
      tenantId: 'inner',
      subdomain: 'inner',
      plan: 'pro',
      features: [],
      createdAt: new Date(),
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
