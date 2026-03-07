import type { NextFunction, Request, Response } from 'express';
import { tenantStorage } from './connection-context';
// Note: We will integrate actual DB lookup later. For now, strict types and structure.

export async function resolveTenant(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const host = req.headers.host || '';
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    // No subdomain means we are likely on the marketing site or main domain
    // We do NOT enter tenant storage context here.
    return next();
  }

  // PENDING: Real DB Lookup will go here in the next step
  // const tenant = await db.query.tenantsInGovernance.findFirst(...)

  // MOCK for scaffolding - TO BE REPLACED WITH DB CALL
  const mockTenant = {
    id: 'mock-tenant-id',
    subdomain: subdomain,
    plan: 'basic' as const,
    enabledFeatures: [],
  };

  // Attach context
  tenantStorage.run(
    {
      tenantId: mockTenant.id,
      subdomain: mockTenant.subdomain,
      plan: mockTenant.plan,
      features: mockTenant.enabledFeatures,
      createdAt: new Date(),
      schemaName: `tenant_${mockTenant.subdomain}`,
      isActive: true,
      isSuspended: false,
    },
    () => {
      next();
    }
  );
}

/**
 * Extracts subdomain from host header.
 * Handles:
 * - tenant.apex.com -> tenant
 * - tenant.localhost:3000 -> tenant
 * - apex.com -> null
 * - www.apex.com -> null (reserved)
 */
export function extractSubdomain(host: string): string | null {
  const parts = host.split('.');

  // Localhost development: tenant.localhost:3000
  if (host.includes('localhost')) {
    if (parts.length < 2 || parts[0] === 'localhost') return null;
    return parts[0];
  }

  // Production: tenant.apex.com
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (
      [
        'www',
        'api',
        'admin',
        'mail',
        'git',
        'super-admin',
        'staging',
        'blue',
        'green',
      ].includes(subdomain)
    )
      return null;
    return subdomain;
  }

  return null;
}

// Export types and helper functions for tenant resolution
export type TenantResolutionStrategy = 'host' | 'header' | 'jwt';

export function extractTenantFromHost(host: string): string | null {
  return extractSubdomain(host);
}

export function extractTenantFromHeader(req: Request): string | null {
  const tenantHeader = req.headers['x-tenant-id'];
  return typeof tenantHeader === 'string' ? tenantHeader : null;
}

export function extractTenantFromJWT(_req: Request): string | null {
  // JWT extraction would be implemented here
  // For now, return null as placeholder
  return null;
}
