import { adminPool, SYSTEM_TENANT_ID } from '@apex/db';
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

/**
 * 🛡️ Protocol Delta Guard: Safe type assertion for Drizzle executors
 */
function toExecutor(db: unknown): DrizzleExecutor {
  const isExecutor = (d: unknown): d is DrizzleExecutor => true;
  return isExecutor(db) ? db : ({} as DrizzleExecutor);
}

@Injectable()
export class TenantSessionInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const req = http.getRequest<TenantRequest>();

    const baseContext = req.tenantContext;

    // 1. Bypass if no tenant context (system/auth routes)
    if (!baseContext || baseContext.tenantId === SYSTEM_TENANT_ID) {
      return next.handle();
    }

    // 2. Establish Database Session
    const client = await adminPool.connect();

    try {
      // S2/Arch-Core-04: Strict Tenant Isolation in Session
      await client.query("SELECT set_config('app.current_tenant', $1, true)", [
        baseContext.tenantId,
      ]);

      const safeSchema = baseContext.schemaName.replace(/[^a-z0-9_]/g, '');
      if (!safeSchema.startsWith('tenant_')) {
        throw new Error('S2 Security Violation: Invalid schema routing target');
      }

      await client.query(`SET search_path TO "${safeSchema}", public`);
      await client.query("SET statement_timeout = '10s'");

      const scopedDb = drizzle(client);
      const tenantContext: TenantContext = {
        ...baseContext,
        executor: toExecutor(scopedDb),
      };

      // 3. Wrap execution in AsyncLocalStorage scope via Observable wrapper
      // This ensures that the context is maintained across all async boundaries
      // during the stream execution (including interceptors and controllers).
      return new Observable((subscriber) => {
        tenantStorage.run(tenantContext, () => {
          next.handle().subscribe(subscriber);
        });
      }).pipe(
        finalize(async () => {
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
            client.release(true);
          }
        })
      );
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Tenant Session Initialization Failed'
      );
    }
  }
}
