/**
 * S2: Tenant Isolation Middleware
 * Constitution Reference: architecture.md (S2 Protocol)
 * Purpose: Extract tenant from subdomain and enforce schema isolation
 */

import { publicDb, tenants, eq, sql } from '@apex/db';
import {
  HttpStatus,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { type TenantContext, tenantStorage } from './connection-context.js';

export interface TenantRequest extends Request {
  tenantContext?: TenantContext;
}

/**
 * Extracts tenant ID from subdomain
 * e.g., alpha.apex.localhost -> alpha
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Localhost development
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
    return null; // Root domain
  }

  // Production
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Validates tenant exists and is active
 * CRITICAL FIX (S2): Replaced mock data with real DB query
 */
async function validateTenant(subdomain: string): Promise<TenantContext> {
  try {
    // Query database for tenant
    const result = await publicDb
      .select({
        id: tenants.id,
        subdomain: tenants.subdomain,
        plan: tenants.plan,
        status: tenants.status,
      })
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (result.length === 0) {
      throw new UnauthorizedException('Tenant not found');
    }

    const tenant = result[0];

    // Check tenant status
    if (tenant.status === 'suspended') {
      throw new UnauthorizedException('Tenant is suspended');
    }

    if (tenant.status !== 'active') {
      throw new UnauthorizedException('Tenant is not active');
    }

    return {
      tenantId: tenant.id,
      schemaName: `tenant_${tenant.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      subdomain: tenant.subdomain,
      plan: tenant.plan as 'free' | 'basic' | 'pro' | 'enterprise',
      isActive: true,
      features: [],
      createdAt: new Date(),
    };
  } catch (error) {
    // If it's already an UnauthorizedException, re-throw it
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    // Log the error but don't expose internal details
    console.error(`S2 Error validating tenant ${subdomain}:`, error);
    throw new UnauthorizedException('Tenant validation failed');
  }
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const subdomain = extractSubdomain(host);

    if (
      !subdomain ||
      [
        'api',
        'super-admin',
        'www',
        'staging',
        'blue',
        'green',
        'git',
        'admin',
        'mail',
      ].includes(subdomain.toLowerCase())
    ) {
      // S2 FIX: Infrastructure subdomains must explicitly set search_path to public
      await publicDb.execute(sql`SET search_path TO public`);
      return next();
    }

    // S2/S4 Bypass: Specific routes that don't require tenant isolation
    // e.g., provisioning a new tenant or system health checks
    // We use originalUrl to ensure we see the full path before NestJS routing shifts it
    const bypassRoutes = [
      '/api/v1/auth/login',
      '/api/v1/health',
      '/api/health',
      '/health',
      '/',
    ];
    const currentPath = req.originalUrl || req.path || '';
    if (
      bypassRoutes.some(
        (route) =>
          currentPath === route ||
          currentPath.startsWith(`${route}/`) ||
          currentPath.startsWith(`${route}?`) ||
          currentPath.includes(`/v1${route}`) ||
          currentPath.includes(`/api/v1${route}`)
      )
    ) {
      // S2 FIX: Even bypassed routes must ensure we are in public schema
      // This prevents "dirty" connections from previous tenant requests.
      await publicDb.execute(sql`SET search_path TO public`);
      return next();
    }

    try {
      const tenantContext = await validateTenant(subdomain);

      // S2: Hard Isolation (Session-Level)
      // We set the search_path immediately before entering the Async context
      await publicDb.execute(
        sql`SET search_path TO ${sql.identifier(tenantContext.schemaName)}, public`
      );

      tenantStorage.run(tenantContext, async () => {
        req.tenantContext = tenantContext;
        res.setHeader('X-Tenant-ID', tenantContext.tenantId);
        res.setHeader('X-Tenant-Schema', tenantContext.schemaName);

        // S2: Verification - Ensure isolation is active for this connection
        try {
          const check = await publicDb.execute(sql`SELECT current_schema()`);
          const currentSchema = (check.rows[0] as any)?.current_schema;
          if (currentSchema !== tenantContext.schemaName) {
            throw new Error(`S2 Violation: Schema isolation failed for ${tenantContext.subdomain}. Found: ${currentSchema}`);
          }
        } catch (e) {
          console.error('S2 Critical Failure:', e);
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'S2 Isolation Failure',
            message: 'Strict security enforcement failed'
          });
        }

        // Reset path after the request is finished/closed to prevent pool contamination
        const cleanup = async () => {
          try {
            await publicDb.execute(sql`SET search_path TO public`);
          } catch (e) {
            console.error('S2 WARNING: Failed to reset search_path', e);
          }
        };

        res.on('finish', cleanup);
        res.on('close', cleanup);

        next();
      });
    } catch (_error) {
      // S2: Invalid or non-existent tenant subdomains are rejected with 403 Forbidden
      res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: `S2 Violation: Domain '${subdomain}' is not authorized`,
        error: 'Forbidden',
      });
    }
  }
}

/**
 * NestJS Guard for Tenant Access Control
 */
import type { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TenantScopedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    if (!request.tenantContext) {
      throw new UnauthorizedException('Tenant context required');
    }

    if (!request.tenantContext.isActive) {
      throw new UnauthorizedException('Tenant is suspended');
    }

    return true;
  }
}

/**
 * Super Admin can access any tenant
 */
@Injectable()
export class SuperAdminOrTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user as any;

    // Super admin bypass
    if (user?.role === 'super_admin') {
      return true;
    }

    // Regular tenant check
    if (!request.tenantContext?.isActive) {
      throw new UnauthorizedException('Tenant access denied');
    }

    // Ensure user belongs to this tenant
    if (user?.tenantId !== request.tenantContext.tenantId) {
      throw new UnauthorizedException('Cross-tenant access denied');
    }

    return true;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
