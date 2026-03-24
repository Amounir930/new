import { tenantPool, SYSTEM_TENANT_ID } from '@apex/db';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  InternalServerErrorException,
  type NestInterceptor,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  type DrizzleExecutor,
  type TenantContext,
  tenantStorage,
} from './connection-context';
import type { TenantRequest } from './tenant-isolation.middleware';
import { toSchemaName } from './utils';

/**
 * 🛡️ Protocol Delta Guard: Safe type assertion for Drizzle executors
 */
function toExecutor(db: any): DrizzleExecutor {
  return db as DrizzleExecutor;
}

@Injectable()
export class TenantSessionInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const req = http.getRequest<TenantRequest & { user?: any }>();

    const baseContext = req.tenantContext;
    const jwtTenantId = req.user?.tenantId;
    const isMerchantToken = jwtTenantId && jwtTenantId !== SYSTEM_TENANT_ID;

    // S2 FIX (Architectural Correction): Prioritize JWT Identity over Domain Inference
    // If the user has a verified Merchant JWT, it COMPLETELY overrides the domain-based context.
    const activeTenantId = isMerchantToken ? jwtTenantId : baseContext?.tenantId;
    
    // Safety Fallback: If no tenant identity can be established, bypass session initialization
    if (!activeTenantId) {
      return next.handle();
    }

    const activeSchema = (isMerchantToken && req.user.subdomain)
      ? toSchemaName(req.user.subdomain)
      : (baseContext?.schemaName || 'public');

    const activeSubdomain = (isMerchantToken && req.user.subdomain)
      ? req.user.subdomain
      : (baseContext?.subdomain || 'root');

    // 3. Establish Database Session
    // We use tenantPool (50 max) instead of adminPool (10 max) for high-concurrency merchant requests
    const client = await tenantPool.connect();

    try {
      // S2/Arch-Core-04: Strict Tenant Isolation in Session
      await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [
        activeTenantId,
      ]);

      const safeSchema = activeSchema.replace(/[^a-z0-9_]/g, '');
      if (!safeSchema.startsWith('tenant_') && safeSchema !== 'public') {
        throw new Error(`S2 Security Violation: Invalid schema routing target (${safeSchema})`);
      }

      await client.query(`SET search_path TO "${safeSchema}", public`);
      await client.query("SET statement_timeout = '20s'");

      const scopedDb = drizzle(client);
      const tenantContext: TenantContext = {
        tenantId: activeTenantId,
        schemaName: safeSchema,
        subdomain: activeSubdomain,
        plan: baseContext?.plan || 'free',
        features: baseContext?.features || [],
        createdAt: baseContext?.createdAt || new Date(),
        isActive: baseContext?.isActive !== false,
        isSuspended: baseContext?.isSuspended === true,
        executor: toExecutor(scopedDb),
      };

      // 4. Wrap execution in AsyncLocalStorage scope
      // By wrapping the return of next.handle(), we ensure the controller execution
      // starts within the context and remains sticky through its async lifecycle.
      return tenantStorage.run(tenantContext, () => {
        return next.handle().pipe(
          finalize(async () => {
            try {
              // S2: Robust cleanup - ROLLBACK ensures we aren't stuck in a failed transaction
              await client.query('ROLLBACK').catch(() => {});
              await client.query(`
                RESET app.current_tenant_id;
                RESET app.role;
                RESET search_path;
              `);
            } finally {
              client.release();
            }
          })
        );
      });
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Tenant Session Initialization Failed'
      );
    }
  }
}
