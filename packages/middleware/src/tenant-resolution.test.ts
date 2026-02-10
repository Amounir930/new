/**
 * Tenant Resolution Tests
 * S2 Protocol: Tenant Resolution
 */

import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { tenantStorage } from './connection-context.js';
import { extractSubdomain, resolveTenant } from './tenant-resolution.js';

describe('extractSubdomain', () => {
  it('should extract subdomain from apex.com domain', () => {
    expect(extractSubdomain('coffee.apex.com')).toBe('coffee');
    expect(extractSubdomain('shop.apex.com')).toBe('shop');
  });

  it('should extract subdomain from localhost', () => {
    expect(extractSubdomain('tenant.localhost:3000')).toBe('tenant');
    expect(extractSubdomain('test.localhost:8080')).toBe('test');
  });

  it('should return null for apex domain', () => {
    expect(extractSubdomain('apex.com')).toBeNull();
  });

  it('should return null for www subdomain', () => {
    expect(extractSubdomain('www.apex.com')).toBeNull();
  });

  it('should return null for reserved subdomains', () => {
    expect(extractSubdomain('api.apex.com')).toBeNull();
    expect(extractSubdomain('admin.apex.com')).toBeNull();
    expect(extractSubdomain('mail.apex.com')).toBeNull();
  });

  it('should handle localhost without subdomain', () => {
    expect(extractSubdomain('localhost:3000')).toBeNull();
  });

  it('should handle multi-level subdomains', () => {
    expect(extractSubdomain('tenant.sub.apex.com')).toBe('tenant');
  });
});

describe('resolveTenant', () => {
  it('should call next() when no subdomain', async () => {
    const req = {
      headers: { host: 'apex.com' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await resolveTenant(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next() when www subdomain', async () => {
    const req = {
      headers: { host: 'www.apex.com' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await resolveTenant(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should set tenant context for valid subdomain', async () => {
    const req = {
      headers: { host: 'test-tenant.apex.com' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await new Promise<void>((resolve) => {
      resolveTenant(req, res, () => {
        const store = tenantStorage.getStore();
        expect(store).toBeDefined();
        expect(store?.subdomain).toBe('test-tenant');
        next();
        resolve();
      });
    });

    expect(next).toHaveBeenCalled();
  });

  it('should handle localhost subdomain', async () => {
    const req = {
      headers: { host: 'myshop.localhost:3000' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    await new Promise<void>((resolve) => {
      resolveTenant(req, res, () => {
        const store = tenantStorage.getStore();
        expect(store?.subdomain).toBe('myshop');
        next();
        resolve();
      });
    });

    expect(next).toHaveBeenCalled();
  });
});

describe('Tenant Extraction Helpers', () => {
  it('should extract tenant from host', () => {
    expect(extractSubdomain('test.apex.com')).toBe('test');
  });

  it('should extract tenant from header', async () => {
    const req = {
      headers: { 'x-tenant-id': 'tenant-789' },
    } as unknown as Request;
    const { extractTenantFromHeader } = await import('./tenant-resolution.js');
    expect(extractTenantFromHeader(req)).toBe('tenant-789');
  });

  it('should return null from extractTenantFromJWT (placeholder)', async () => {
    const { extractTenantFromJWT } = await import('./tenant-resolution.js');
    expect(extractTenantFromJWT({} as any)).toBeNull();
  });
});
