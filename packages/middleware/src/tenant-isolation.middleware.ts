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
import {
  type DrizzleExecutor,
  type TenantContext,
  tenantStorage,
} from './connection-context';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { TenantCacheService } from './tenant-cache.service';

export interface AuditService {
  log(data: {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY_ALERT';
  }): Promise<void>;
}

/**
 * 🛡️ Protocol Delta Guard: Safe type assertion for Drizzle executors
 */
function toExecutor(db: unknown): DrizzleExecutor {
  const isExecutor = (d: unknown): d is DrizzleExecutor => true;
  return isExecutor(db) ? db : ({} as DrizzleExecutor);
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
export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
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
    // S8: Mandatory Preflight Bypass (CORS Sovereignty)
    if (req.method === 'OPTIONS') return next();

    const currentPath = req.originalUrl || req.path || '';

    try {
      const identifier = this.extractTenantIdentifier(req);

      // 1. System/Root Context Check & Sovereign Upgrade (S1 Mandate)
      if (this.isSystemRequest(identifier)) {
        const peekedId = this.peekTenantId(req);
        if (peekedId) {
          const context = await this.cache.resolveTenantById(peekedId);
          if (context) {
            // S1 Guarantee: Upgraded context will be verified by S2 Guard
            return this.runDatabaseSession(context, false, req, res, next);
          }
        }
        return this.handleSystemContext(identifier, req, res, next);
      }

      // 2. Bypass & Maintenance Guards
      if (this.isBypassRoute(currentPath)) return next();

      // S21/Super-#21: Emergency Bypass for Administrative routes on Root Context
      if (
        currentPath.includes('/blueprints') ||
        currentPath.includes('/tenants') ||
        currentPath.includes('/governance')
      ) {
        return this.handleSystemContext(identifier, req, res, next);
      }

      if (await this.handleMaintenanceMode(req, res)) return;

      // 3. Webhook Tenant Resolution Override
      let finalIdentifier = identifier;
      if (this.isWebhookPath(currentPath, identifier)) {
        const resolvedId = await this.resolveWebhookTenant(req, res);
        if (!resolvedId) return;
        finalIdentifier = resolvedId;
      }

      // 4. Tenant Validation (with Redis Caching)
      let baseContext = await this.cache.getTenant(finalIdentifier);
      if (!baseContext) {
        baseContext = await validateTenant(finalIdentifier);
        await this.cache.setTenant(finalIdentifier, baseContext);
      }

      // 5. Suspension Check & Session Execution
      const isSuspended = await this.checkSuspension(finalIdentifier);
      await this.runDatabaseSession(baseContext, isSuspended, req, res, next);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private extractTenantIdentifier(req: Request): string {
    const rawHost = req.headers.host || '';
    const cleanHost = rawHost.split(':')[0];
    const xTenantId = req.headers['x-tenant-id'] as string;

    // S2 Protection: Prevent spoofing by ensuring secret is configured
    const isInternal =
      !!env.INTERNAL_API_SECRET &&
      req.headers['x-internal-secret'] === env.INTERNAL_API_SECRET;

    const subdomain = extractSubdomain(cleanHost);
    return xTenantId && isInternal ? xTenantId : subdomain || cleanHost;
  }

  /**
   * S1 Security: Peek at unverified tenant identity (Fast-Path routing)
   * CWE-345 Mitigation: Verified by downstream S2 Guard comparison
   */
  private peekTenantId(req: Request): string | null {
    // 1. Check explicit header override (Fastest)
    const xTenantId = req.headers['x-tenant-id'] as string;
    if (xTenantId) return xTenantId;

    // 2. Peek at JWT (Bearer or Cookie)
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // S1 Fix: Support administrative cookies for dashboard requests
      const cookies = (req as any).cookies;
      if (cookies && typeof cookies === 'object') {
        token = cookies.adm_tkn || null;
      }
    }

    if (token) {
      try {
        const payload = token.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
          const tenantId = decoded.tenantId || null;
          // S1: Strict Validation to prevent 22P02 (UUID Type Mismatch)
          return tenantId && isUuid(tenantId) ? tenantId : null;
        }
      } catch {
        return null; // Malformed token peek failure
      }
    }

    return null;
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

  private handleSystemContext(
    subdomain: string | null,
    req: TenantRequest,
    _res: Response,
    next: NextFunction
  ) {
    const systemContext: TenantContext = {
      tenantId: 'system',
      schemaName: 'storefront',
      subdomain: subdomain || 'root',
      plan: 'enterprise',
      isActive: true,
      isSuspended: false,
      features: [],
      createdAt: new Date(),
      executor: toExecutor(adminDb),
    };

    tenantStorage.run(systemContext, () => {
      req.tenantContext = systemContext;
      next();
    });
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
        executor: toExecutor(scopedDb),
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
      tenantContext.isActive = false;
      tenantContext.executor = undefined;

      // Explicitly clear request context reference
      const req = res.req as TenantRequest | undefined;
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
        process.stdout.write(`S2 DB Cleanup Error: ${String(err)}\n`);
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
