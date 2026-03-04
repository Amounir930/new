import { env } from '@apex/config';
import { adminDb, adminPool, eq, tenantsInGovernance } from '@apex/db';
import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NextFunction, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { type TenantContext, tenantStorage } from './connection-context.js';

export interface TenantRequest extends Request {
  tenantContext?: TenantContext;
  user?: unknown;
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
      schemaName: `tenant_${tenant.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      subdomain: tenant.subdomain,
      plan: tenant.plan as 'free' | 'basic' | 'pro' | 'enterprise',
      isActive: true,
      isSuspended: false,
      features: [],
      createdAt: new Date(),
    };
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    process.stdout.write(`S2 Error validating tenant ${identifier}:`, error);
    throw new UnauthorizedException('Tenant validation failed');
  }
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  async use(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      const rawHost = req.headers.host || '';
      const cleanHost = rawHost.split(':')[0];
      const xTenantId = req.headers['x-tenant-id'] as string;
      const isInternal =
        req.headers['x-internal-secret'] === env.INTERNAL_API_SECRET;

      const subdomain = extractSubdomain(cleanHost);
      let identifier = subdomain || cleanHost;

      if (xTenantId && isInternal) {
        identifier = xTenantId;
      }

      // 1. System/Root Context Check
      if (this.isSystemRequest(subdomain)) {
        return this.handleSystemContext(subdomain, req, res, next);
      }

      const currentPath = req.originalUrl || req.path || '';

      // 2. Bypass Routes
      if (this.isBypassRoute(currentPath)) {
        return next();
      }

      // 3. Maintenance Mode Check
      if (await this.handleMaintenanceMode(req, res)) {
        return;
      }

      // 4. Webhook Tenant Resolution
      if (this.isWebhookPath(currentPath, subdomain)) {
        const resolvedId = await this.resolveWebhookTenant(req, res);
        if (!resolvedId) return; // Response handled in helper
        identifier = resolvedId;
      }

      // 5. Tenant Validation
      const baseContext = await validateTenant(identifier);
      if (!this.checkTenantStatus(baseContext, req, res)) return;

      // 6. Suspension Check (Steel Control)
      const isSuspended = await this.checkSuspension(identifier);

      // 7. Database Session
      await this.runDatabaseSession(baseContext, isSuspended, req, res, next);
    } catch (error) {
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
  }

  private isSystemRequest(subdomain: string | null): boolean {
    if (!subdomain) return true;
    const systemSubdomains = [
      'api',
      'super-admin',
      'www',
      'staging',
      'blue',
      'green',
      'git',
      'admin',
      'mail',
    ];
    return systemSubdomains.includes(subdomain.toLowerCase());
  }

  private handleSystemContext(
    subdomain: string | null,
    req: TenantRequest,
    _res: Response,
    next: NextFunction
  ) {
    const systemContext: TenantContext = {
      tenantId: 'system',
      schemaName: 'public',
      subdomain: subdomain || 'root',
      plan: 'enterprise',
      isActive: true,
      isSuspended: false,
      features: [],
      createdAt: new Date(),
      executor: adminDb,
    };

    tenantStorage.run(systemContext, () => {
      req.tenantContext = systemContext;
      next();
    });
  }

  private isBypassRoute(path: string): boolean {
    const bypassRoutes = ['/health', '/api/v1/auth/login', '/favicon.ico'];
    return bypassRoutes.some(
      (route) => path === route || path.startsWith(`${route}/`)
    );
  }

  private async handleMaintenanceMode(
    _req: TenantRequest,
    _res: Response
  ): Promise<boolean> {
    // Maintenance mode logic has been temporarily disabled
    // as the legacy `system_settings` table was removed in the Zero-Trust refactor.
    return false;
  }

  private isWebhookPath(path: string, subdomain: string | null): boolean {
    const webhookPaths = ['/api/v1/payments/webhook', '/api/v1/webhooks'];
    return (
      webhookPaths.some((p) => path === p || path.startsWith(`${p}/`)) &&
      (!subdomain || ['api', 'www'].includes(subdomain.toLowerCase()))
    );
  }

  private async resolveWebhookTenant(
    req: TenantRequest,
    res: Response
  ): Promise<string | null> {
    try {
      const crypto = await import('node:crypto');
      const signature =
        (req.headers['stripe-signature'] as string) ||
        (req.headers['x-webhook-signature'] as string) ||
        '';

      const rawBodyBuffer: Buffer =
        (req as never).rawBody || Buffer.from(JSON.stringify(req.body || {}));

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

  private checkTenantStatus(
    baseContext: Omit<TenantContext, 'executor'>,
    req: TenantRequest,
    res: Response
  ): boolean {
    if (!baseContext.isActive && req.user?.role !== 'super_admin') {
      res.status(HttpStatus.FORBIDDEN).json({
        error: 'Tenant Suspended',
        message: 'This storefront has been suspended by governance.',
      });
      return false;
    }
    return true;
  }

  private async checkSuspension(identifier: string): Promise<boolean> {
    try {
      const { SecurityService } = await import('./security.service.js');
      const security = new SecurityService(env as never);
      const lockData = await security.getTenantLock(identifier);
      return !!lockData?.locked;
    } catch {
      return false;
    }
  }

  private async runDatabaseSession(
    baseContext: Omit<TenantContext, 'executor'>,
    isSuspended: boolean,
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ) {
    const client = await adminPool.connect();
    let cleanupRegistered = false;
    try {
      await client.query("SELECT set_config('app.current_tenant', $1, true)", [
        baseContext.tenantId,
      ]);
      await client.query("SET statement_timeout = '10s'");

      const scopedDb = drizzle(client);
      const tenantContext: TenantContext = {
        ...baseContext,
        isSuspended,
        executor: scopedDb,
      };

      await tenantStorage.run(tenantContext, async () => {
        req.tenantContext = tenantContext;
        res.setHeader('X-Tenant-ID', tenantContext.tenantId);

        this.registerCleanup(client, res, tenantContext);
        cleanupRegistered = true;
        next();
      });
    } catch (error) {
      if (!cleanupRegistered) {
        // Only cleanup here if it wasn't registered to the response lifecycle
        await client.query('ROLLBACK').catch(() => {});
        await client.query('RESET ALL; DISCARD ALL;').catch(() => {});
        client.release();
      }

      res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message:
          error instanceof Error ? error.message : 'Tenant Access Denied',
        error: 'Forbidden',
      });
    }
  }

  private registerCleanup(
    client: PoolClient,
    res: Response,
    tenantContext: TenantContext
  ) {
    let isCleanedUp = false;
    const cleanup = async () => {
      if (isCleanedUp) return;
      isCleanedUp = true;

      // Item 31: Force cleanup of context properties to prevent bleeding/leaks
      (tenantContext as never).isActive = false;
      (tenantContext as never).executor = null;

      // Explicitly clear request context reference
      const req = (res as never).req;
      if (req) {
        req.tenantContext = undefined;
      }

      try {
        // S2: Robust cleanup - ROLLBACK ensures we aren't stuck in a failed transaction
        await client.query('ROLLBACK').catch(() => {});
        await client.query(`
          RESET app.current_tenant;
          RESET app.role;
          RESET search_path;
          RESET ALL;
        `);
        client.release();
      } catch (err) {
        process.stdout.write('S2 DB Cleanup Error:', err);
        // If cleanup fails, we must DESTROY the client to prevent contamination
        client.release(true);
      }
    };

    // Ensure cleanup runs on all termination paths
    res.once('finish', cleanup);
    res.once('close', cleanup);
    res.once('error', cleanup);
  }
}

@Injectable()
export class TenantScopedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.tenantContext) {
      throw new UnauthorizedException('Tenant context required');
    }
    if (!request.tenantContext.isActive) {
      throw new UnauthorizedException('Tenant is inactive');
    }
    if (request.tenantContext.isSuspended) {
      throw new UnauthorizedException('Tenant is suspended (Steel Control)');
    }
    return true;
  }
}

@Injectable()
export class SuperAdminOrTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user as never;

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

declare global {
  namespace Express {
    interface Request {
      user?: unknown;
    }
  }
}
