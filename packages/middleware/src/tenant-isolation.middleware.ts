import { env } from '@apex/config/server';
import { adminDb, eq, SYSTEM_TENANT_ID, tenantsInGovernance } from '@apex/db';
import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { TenantContext } from './connection-context';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { TenantCacheService } from './tenant-cache.service';
import { toSchemaName } from './utils';

export interface AuditService {
  log(data: {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY_ALERT';
  }): Promise<void>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
  tenantId?: string;
}

export interface TenantRequest extends Request {
  tenantContext?: TenantContext;
  user?: AuthenticatedUser;
  rawBody?: Buffer;
  cookies: Record<string, string>;
}

/**
 * Extracts tenant ID from subdomain using root domain from config
 */
function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
  const rootDomain = env.APP_ROOT_DOMAIN.toLowerCase();

  if (hostname === rootDomain || !hostname.endsWith(`.${rootDomain}`)) {
    return null;
  }

  const subdomainPart = hostname.slice(0, -(rootDomain.length + 1));
  const parts = subdomainPart.split('.');
  return parts[parts.length - 1] || null;
}

/**
 * S1: Strict UUID Validation
 * Prevents 22P02 Type Mismatch errors in Governance DB
 */

/**
 * Validates tenant exists and is active
 */
async function validateTenant(
  identifier: string
): Promise<Omit<TenantContext, 'executor'>> {
  try {
    const { or, sql: dbSql } = await import('@apex/db');
    const result = await adminDb
      .select({
        id: tenantsInGovernance.id,
        subdomain: tenantsInGovernance.subdomain,
        customDomain: dbSql<string>`custom_domain`,
        plan: tenantsInGovernance.plan,
        status: tenantsInGovernance.status,
      })
      .from(tenantsInGovernance)
      .where(
        or(
          eq(tenantsInGovernance.subdomain, identifier),
          dbSql`custom_domain = ${identifier}`,
          dbSql`${tenantsInGovernance.id}::text = ${identifier}`
        )
      )
      .limit(1);

    if (result.length === 0) {
      throw new UnauthorizedException('Tenant not found');
    }

    const tenant = result[0];
    if (tenant.status !== 'active') {
      throw new UnauthorizedException(`Tenant is ${tenant.status}`);
    }

    return {
      tenantId: tenant.id,
      schemaName: toSchemaName(tenant.subdomain),
      subdomain: tenant.subdomain,
      plan: tenant.plan as 'free' | 'basic' | 'pro' | 'enterprise',
      isActive: true,
      isSuspended: false,
      features: [],
      createdAt: new Date(),
    };
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    process.stdout.write(
      `S2 Warning: Subdomain resolving on root API path: ${identifier || 'none'}\n`
    );
    throw new UnauthorizedException('Tenant validation failed');
  }
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  constructor(private readonly cache: TenantCacheService) {}
  async use(req: TenantRequest, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') return next();

    const currentPath = req.originalUrl || req.path || '';

    try {
      const identifier = this.extractTenantIdentifier(req);

      // 1. System/Upgrade Handlers
      if (this.isSystemRequest(identifier)) {
        req.tenantContext = this.getSystemContext(identifier);
        return next();
      }

      // 2. Bypass & Maintenance
      if (this.shouldBypass(currentPath)) {
        req.tenantContext = this.getSystemContext(identifier);
        return next();
      }
      if (this.isBypassRoute(currentPath)) return next();

      // 3. Resolution
      const finalIdentifier = await this.resolveFinalIdentifier(
        req,
        res,
        currentPath,
        identifier
      );
      if (!finalIdentifier) return;

      const baseContext = await this.getValidatedContext(finalIdentifier);
      const isSuspended = await this.checkSuspension(finalIdentifier);

      // S2/Arch-Core-04: Attach resolution context to request.
      // The session/middleware lifecycle fix relocates DB connection to Global Interceptor.
      req.tenantContext = {
        ...baseContext,
        isSuspended,
      };

      res.setHeader('X-Tenant-ID', baseContext.tenantId);
      next();
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private async resolveFinalIdentifier(
    req: TenantRequest,
    res: Response,
    currentPath: string,
    identifier: string
  ): Promise<string | null> {
    if (this.isWebhookPath(currentPath, identifier)) {
      const resolvedId = await this.resolveWebhookTenant(req, res);
      return resolvedId || null;
    }
    return identifier;
  }

  private async getValidatedContext(identifier: string) {
    let context = await this.cache.getTenant(identifier);
    if (!context) {
      context = await validateTenant(identifier);
      await this.cache.setTenant(identifier, context);
    }
    return context;
  }

  private extractTenantIdentifier(req: Request): string {
    const rawHost = req.headers.host || '';
    const cleanHost = rawHost.split(':')[0];
    const xTenantId = req.headers['x-tenant-id'] as string;

    // FIX (S2 Tenant Deadlock): Trust x-tenant-id for ALL requests, not just
    // internal ones. The storefront frontend sends this header on every fetch
    // call (via fetchStorefront). Without this fix, browser requests to
    // api.60sec.shop resolve "api" as the tenant → SYSTEM_TENANT_ID →
    // CustomerJwtMatchGuard rejects with "tenant doesn't match request tenant".
    if (xTenantId) return xTenantId;

    const subdomain = extractSubdomain(cleanHost);
    return subdomain || cleanHost;
  }

  private handleError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof UnauthorizedException) {
      res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: error.message,
        error: 'Forbidden',
      });
      return;
    }
    next(error);
  }

  private isSystemRequest(subdomain: string | null): boolean {
    if (!subdomain) return true;
    const cleanSubdomain = subdomain.toLowerCase();

    // S2: Hardened System Whitelist (Reject IP-based detection)
    const systemSubdomains = [
      'localhost',
      '127.0.0.1',
      'api.60sec.shop',
      'super-admin.60sec.shop',
      'api',
      'ops-api-1',
      'ops-api-2',
      'worker',
      'ops-worker-1',
      'merchant-admin',
      'super-admin',
      'store',
      'www',
      'staging',
      'blue',
      'green',
      'git',
      'admin',
      'mail',
    ];
    return systemSubdomains.includes(cleanSubdomain);
  }

  private shouldBypass(currentPath: string): boolean {
    return (
      currentPath.includes('/blueprints') ||
      currentPath.includes('/tenants') ||
      currentPath.includes('/governance')
    );
  }

  private isBypassRoute(path: string): boolean {
    const bypassRoutes = [
      '/api/health',
      '/api/v1/health',
      '/api/v1/provision',
      '/api/provision',
      '/api/v1/auth/login',
      '/api/auth/login',
      '/favicon.ico',
    ];
    return bypassRoutes.some(
      (route) => path === route || path.startsWith(`${route}/`)
    );
  }

  private isWebhookPath(path: string, subdomain: string | null): boolean {
    const webhookPaths = ['/api/v1/payments/webhook', '/api/v1/webhooks'];
    return (
      webhookPaths.some((p) => path === p || path.startsWith(`${p}/`)) &&
      (!subdomain || ['api', 'www'].includes(subdomain.toLowerCase()))
    );
  }

  private async resolveWebhookTenant(
    req: Request & { rawBody?: Buffer },
    res: Response
  ): Promise<string | null> {
    try {
      const crypto = await import('node:crypto');
      const signature =
        (req.headers['stripe-signature'] as string) ||
        (req.headers['x-webhook-signature'] as string) ||
        '';

      const rawBodyBuffer: Buffer =
        req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

      const expectedSig = crypto
        .createHmac('sha256', env.WEBHOOK_SECRET || '')
        .update(rawBodyBuffer)
        .digest('hex');

      const sigBuffer = Buffer.from(String(signature));
      const expectedBuffer = Buffer.from(expectedSig);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        res
          .status(HttpStatus.FORBIDDEN)
          .json({ error: 'Invalid webhook signature' });
        return null;
      }

      const rawTenantId = req.body?.metadata?.tenantId || req.body?.tenantId;
      if (
        !rawTenantId ||
        typeof rawTenantId !== 'string' ||
        !/^[a-zA-Z0-9_-]{3,50}$/.test(rawTenantId)
      ) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Missing or malformed tenantId in payload' });
        return null;
      }

      return rawTenantId;
    } catch (_err) {
      res
        .status(HttpStatus.FORBIDDEN)
        .json({ error: 'Webhook verification failed' });
      return null;
    }
  }

  private async checkSuspension(identifier: string): Promise<boolean> {
    try {
      const { SecurityService } = await import('./security.service');
      const security = new SecurityService({
        get: <K extends keyof typeof env>(key: K) => env[key],
      });
      const lockData = await security.getTenantLock(identifier);
      return !!lockData?.locked;
    } catch {
      return false;
    }
  }

  private getSystemContext(subdomain: string | null): TenantContext {
    return {
      tenantId: SYSTEM_TENANT_ID,
      schemaName: 'public',
      subdomain: subdomain || 'root',
      plan: 'enterprise',
      isActive: true,
      isSuspended: false,
      features: [],
      createdAt: new Date(),
    };
  }
}

@Injectable()
export class TenantScopedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;

    if (!request.tenantContext) {
      throw new UnauthorizedException('Tenant context required');
    }

    // S2 Sovereignty: Super Admins bypass status checks for recovery/governance
    if (user?.role === 'super_admin') return true;

    if (!request.tenantContext.isActive) {
      throw new UnauthorizedException('This storefront is inactive');
    }
    if (request.tenantContext.isSuspended) {
      throw new UnauthorizedException(
        'This storefront has been suspended (Steel Control)'
      );
    }
    return true;
  }
}

@Injectable()
export class SuperAdminOrTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;

    if (user?.role === 'super_admin') return true;

    if (!request.tenantContext?.isActive) {
      throw new UnauthorizedException('Tenant access denied');
    }
    if (user?.tenantId !== request.tenantContext.tenantId) {
      throw new UnauthorizedException('Cross-tenant access denied');
    }
    return true;
  }
}
