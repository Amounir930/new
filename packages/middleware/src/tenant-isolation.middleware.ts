import { eq, publicDb, publicPool, sql, tenants } from '@apex/db';
import { env } from '@apex/config';
import {
  HttpStatus,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { type TenantContext, tenantStorage } from './connection-context.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { dbContextStorage } from '@apex/db';

export interface TenantRequest extends Request {
  tenantContext?: TenantContext;
}

/**
 * Extracts tenant ID from subdomain using root domain from config
 * Handles complex TLDs (Point 'ب')
 */
function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
  const rootDomain = env.APP_ROOT_DOMAIN.toLowerCase();

  // If already at root domain or doesn't end with root domain, return null
  if (hostname === rootDomain || !hostname.endsWith(`.${rootDomain}`)) {
    return null;
  }

  // Extract the part before the root domain
  const subdomainPart = hostname.slice(0, -(rootDomain.length + 1));
  const parts = subdomainPart.split('.');

  // Return the first part (innermost subdomain)
  return parts[parts.length - 1] || null;
}

/**
 * Validates tenant exists and is active (Supports subdomains and custom domains)
 */
async function validateTenant(identifier: string): Promise<Omit<TenantContext, 'executor'>> {
  try {
    const { or, sql } = await import('@apex/db');
    const result = await publicDb
      .select({
        id: tenants.id,
        subdomain: tenants.subdomain,
        customDomain: sql<string>`custom_domain`,
        plan: tenants.plan,
        status: tenants.status,
      })
      .from(tenants)
      .where(
        or(
          eq(tenants.subdomain, identifier),
          sql`custom_domain = ${identifier}`,
          sql`${tenants.id}::text = ${identifier}`
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
      isSuspended: false, // S15 FIX 19A: Default; overridden by Steel Control in middleware
      features: [],
      createdAt: new Date(),
    };
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    console.error(`S2 Error validating tenant ${identifier}:`, error);
    throw new UnauthorizedException('Tenant validation failed');
  }
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const rawHost = req.headers.host || '';
    const cleanHost = rawHost.split(':')[0]; // S2 FIX 16D: Backend Port Stripping
    const xTenantId = req.headers['x-tenant-id'] as string;

    // S2 FIX 18A: Cryptographic Internal Secret (IP Spoofing Defense)
    // Never trust req.ip — X-Forwarded-For is client-controllable with trust proxy.
    // Only trust x-tenant-id when accompanied by a shared secret.
    const isInternal = req.headers['x-internal-secret'] === env.INTERNAL_API_SECRET;
    const subdomain = extractSubdomain(cleanHost);
    let identifier = subdomain || cleanHost;
    if (xTenantId && isInternal) {
      identifier = xTenantId; // Only trust header with valid cryptographic secret
    }

    // Infrastructure subdomains or root domain
    if (
      !subdomain ||
      [
        'api', 'super-admin', 'www', 'staging', 'blue', 'green', 'git', 'admin', 'mail'
      ].includes(subdomain.toLowerCase())
    ) {
      return next();
    }

    // Bypass routes (Health, Login only — NOT Webhooks)
    const bypassRoutes = [
      '/health',
      '/api/v1/auth/login',
      '/favicon.ico',
    ];
    const currentPath = req.originalUrl || req.path || '';
    if (bypassRoutes.some(route => currentPath === route || currentPath.startsWith(`${route}/`))) {
      return next();
    }

    // S2 FIX 20B: Webhook routes get their own tenant resolution via payload
    const webhookPaths = ['/api/v1/payments/webhook', '/api/v1/webhooks'];
    const isWebhook = webhookPaths.some(p => currentPath === p || currentPath.startsWith(`${p}/`));
    if (isWebhook && (!subdomain || ['api', 'www'].includes(subdomain.toLowerCase()))) {
      // Webhook arrives on infra domain — resolve tenant from signed payload
      try {
        const crypto = await import('node:crypto');
        const signature = req.headers['stripe-signature'] || req.headers['x-webhook-signature'] || '';

        // S2 FIX 21A: Use preserved raw body bytes, NOT re-serialized JSON
        // JSON.stringify destroys key ordering/whitespace → HMAC mismatch 100% of the time
        const rawBodyBuffer: Buffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));

        const expectedSig = crypto.createHmac('sha256', env.WEBHOOK_SECRET || '')
          .update(rawBodyBuffer).digest('hex');

        // Constant-time comparison to prevent timing attacks
        const sigBuffer = Buffer.from(String(signature));
        const expectedBuffer = Buffer.from(expectedSig);
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          res.status(HttpStatus.FORBIDDEN).json({ error: 'Invalid webhook signature' });
          return;
        }

        // S2 FIX 21A: Strict sanitization — prevent NoSQL/ORM injection via payload
        const rawTenantId = req.body?.metadata?.tenantId || req.body?.tenantId;
        if (!rawTenantId || typeof rawTenantId !== 'string' || !/^[a-zA-Z0-9_-]{3,50}$/.test(rawTenantId)) {
          res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing or malformed tenantId in payload' });
          return;
        }

        identifier = rawTenantId;
      } catch (err) {
        res.status(HttpStatus.FORBIDDEN).json({ error: 'Webhook verification failed' });
        return;
      }
    }

    // S2 FIX 19B: Validate BEFORE connecting to pool (DoS Prevention)
    // Fake tenants are rejected using lightweight publicDb, not the dedicated pool.
    const baseContext = await validateTenant(identifier);

    // S15 FIX 19A: Steel Control - set isSuspended flag instead of throwing
    // Guards enforce suspension (Super Admin bypasses, regular users blocked)
    let isSuspended = false;
    try {
      const { SecurityService } = await import('./security.service.js');
      const security = new SecurityService(env as any);
      const lockData = await security.getTenantLock(identifier);
      if (lockData?.locked) {
        isSuspended = true;
      }
    } catch {
      // Redis down? Proceed without suspension check (fail-open for availability)
    }

    // NOW allocate the dedicated connection (only for validated tenants)
    const client = await publicPool.connect();

    try {
      // 🚀 Performance Optimization: Combined Session Prep
      // S2: Secure Session Prep (SQL Injection Fix)
      await client.query(`SET search_path TO "${baseContext.schemaName}"`);
      await client.query('SELECT set_config(\'app.current_tenant_id\', $1, false)', [baseContext.tenantId]);

      // Create scoped Drizzle instance using THIS SPECIFIC CLIENT
      const scopedDb = drizzle(client);

      const tenantContext: TenantContext = {
        ...baseContext,
        isSuspended,
        executor: scopedDb
      };

      tenantStorage.run(tenantContext, () => {
        dbContextStorage.run(tenantContext.executor, () => {
          req.tenantContext = tenantContext;
          res.setHeader('X-Tenant-ID', tenantContext.tenantId);

          // Clean up: Release client back to pool when request ends
          let isCleanedUp = false; // 🛡️ S2 FIX: Prevent Double Release Crash
          const cleanup = () => {
            if (isCleanedUp) return;
            isCleanedUp = true;

            // S2 FIX 18B: Destroy executor to prevent Dangling Promise corruption
            (tenantContext as any).isActive = false;
            (tenantContext as any).executor = null;

            // S2 FIX: DISCARD ALL to prevent Pool Poisoning
            client.query('DISCARD ALL')
              .catch(err => console.error('S2 DB Cleanup Error', err))
              .finally(() => {
                client.release();
              });
          };

          res.once('finish', cleanup); // Using once for idempotency
          res.once('close', cleanup);

          next();
        });
      });
    } catch (error) {
      // S2 FIX 17A: DISCARD ALL even on error path (Dirty Catch Prevention)
      client.query('DISCARD ALL')
        .catch(() => { /* swallow cleanup errors */ })
        .finally(() => client.release());

      res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: error instanceof Error ? error.message : 'Tenant Access Denied',
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
      throw new UnauthorizedException('Tenant is inactive');
    }

    // S15 FIX 19A: Enforce suspension at Guard level (NOT Middleware)
    if (request.tenantContext.isSuspended) {
      throw new UnauthorizedException('Tenant is suspended (Steel Control)');
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
