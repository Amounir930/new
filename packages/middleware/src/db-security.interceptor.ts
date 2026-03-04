import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { tenantStorage } from './connection-context.js';

@Injectable()
export class DbSecurityInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    return next.handle().pipe(
      finalize(async () => {
        const tenantContext = tenantStorage.getStore();
        if (!tenantContext) return;

        const executor = tenantContext.executor;
        if (!executor) return;

        try {
          // Point #3/#13: Catastrophic Pool Poisoning Defense
          // Explicitly reset all session variables that could bleed into the next request.
          // Note: The middleware also calls DISCARD ALL which is the nuclear option.
          // This interceptor provides a secondary application-layer safety net.

          // We use the raw client if available to perform the reset
          const client = (executor as never).session?.client;
          if (client) {
            await client.query(`
              RESET app.current_tenant;
              RESET app.role;
              RESET search_path;
              RESET ALL;
            `);
          }
        } catch (error) {
          process.stdout.write(
            'CRITICAL: Failed to reset DB session state:',
            error
          );
          // Mandate Pt 3: Connection destruction on all reset failure
          const client = (executor as never).session?.client;
          if (client && typeof client.release === 'function') {
            // Passing true to release() usually signals to the pool to destroy the client (pg specific)
            client.release(true);
          }
        }
      })
    );
  }
}
