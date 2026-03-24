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

    // S2 Lean Fix: Prioritize JWT authority over Domain authority if domain is 'system'
    const isSystemContext = baseContext?.tenantId === SYSTEM_TENANT_ID;
    const hasMerchantIdentity = req.user?.tenantId && req.user.tenantId !== SYSTEM_TENANT_ID;

    // 1. Bypass only if truly no tenant identity is possible
    if (!baseContext || (isSystemContext && !hasMerchantIdentity)) {
      return next.handle();
    }

    // 2. Resolve Active Identities (Lean Upgrade)
    const activeTenantId = hasMerchantIdentity ? req.user.tenantId : baseContext.tenantId;
    const activeSchema = hasMerchantIdentity && req.user.subdomain 
      ? toSchemaName(req.user.subdomain) 
      : baseContext.schemaName;

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
        ...baseContext,
        tenantId: activeTenantId,
        schemaName: safeSchema,
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
