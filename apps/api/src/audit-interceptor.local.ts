import {
  AUDIT_LOG_METADATA_KEY,
  type AuditLogOptions,
  AuditService,
} from '@apex/audit';
import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable, tap } from 'rxjs';

/**
 * S4: Global Audit Interceptor
 * Automatically logs all write operations (POST, PUT, DELETE, PATCH)
 * Uses @AuditLog decorator metadata if present, otherwise uses route info.
 *
 * NOTE: This is hosted locally in apps/api to resolve DI resolution issues
 * during mocked OpenAPI generation.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    const isWriteOp = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_METADATA_KEY,
      context.getHandler()
    );

    if (!isWriteOp && !auditOptions) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (data: any) => {
          await this.performAudit(context, auditOptions, data, 'SUCCESS');
        },
        error: async (error: any) => {
          await this.performAudit(context, auditOptions, error, 'FAILURE');
        },
      })
    );
  }

  private async performAudit(
    context: ExecutionContext,
    options: AuditLogOptions | undefined,
    resultData: any,
    resultStatus: 'SUCCESS' | 'FAILURE'
  ) {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const user = (request as any).user;

    const action = options?.action || `${method}:${url}`;
    const entityType = options?.entityType || 'api_request';

    const entityId =
      request.params?.id ||
      request.body?.id ||
      request.body?.subdomain ||
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
            ? { error: resultData?.message || resultData?.toString() }
            : {}),
        },
      });
    } catch (err) {
      console.error('S4 Auditing Failed:', err);
    }
  }
}
