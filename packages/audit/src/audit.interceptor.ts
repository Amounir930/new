import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable, tap } from 'rxjs';
import {
  AUDIT_LOG_METADATA_KEY,
  type AuditLogOptions,
} from './audit.decorator.js';
import { AuditService } from './audit.service.js';

/**
 * S4: Global Audit Interceptor
 * Automatically logs all write operations (POST, PUT, DELETE, PATCH)
 * Uses @AuditLog decorator metadata if present, otherwise uses route info.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit write operations by default
    const isWriteOp = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    // Check for explicit @AuditLog decorator
    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_METADATA_KEY,
      context.getHandler()
    );

    if (!isWriteOp && !auditOptions) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (data: unknown) => {
          await this.performAudit(context, auditOptions, data, 'SUCCESS');
        },
        error: async (error: unknown) => {
          await this.performAudit(context, auditOptions, error, 'FAILURE');
        },
      })
    );
  }

  private async performAudit(
    context: ExecutionContext,
    options: AuditLogOptions | undefined,
    resultData: unknown,
    resultStatus: 'SUCCESS' | 'FAILURE'
  ) {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const user = (request as any).user;

    // Determine action name
    const action = options?.action || `${method}:${url}`;
    const entityType = options?.entityType || 'api_request';

    // Extract entityId if possible from params or body
    const entityId =
      (request as any).params?.id ||
      (request as any).body?.id ||
      (request as any).body?.subdomain ||
      'unknown';

    try {
      await this.auditService.log({
        action,
        entityType,
        entityId,
        userId: user?.id,
        userEmail: user?.email,
        ipAddress: ip,
        userAgent: headers['user-agent'],
        severity:
          options?.severity || (resultStatus === 'FAILURE' ? 'HIGH' : 'INFO'),
        result: resultStatus,
        metadata: {
          path: url,
          method,
          statusCode: context.switchToHttp().getResponse().statusCode,
          ...(resultStatus === 'FAILURE'
            ? { error: (resultData as any)?.message || (resultData as any)?.toString() }
            : {}),
        },
      });
    } catch (err) {
      // Fail-safe: don't crash the request if auditing fails, but log it
      process.stderr.write(`S4 Auditing Failed: ${String(err)}\n`);
    }
  }
}
