import type { AuthenticatedUser } from '@apex/middleware';
import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { type Observable, tap } from 'rxjs';
import {
  AUDIT_LOG_METADATA_KEY,
  type AuditLogOptions,
} from './audit.decorator';
import { AuditService } from './audit.service';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

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
  ) {}

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
          // Sovereign Checkpoint: Capture validation failures as independent events
          const status = (error as { status?: number })?.status;
          let specializedAction = auditOptions?.action;
          
          if (status === 400) {
            specializedAction = 'API_VALIDATION_FAILED';
          }
          
          await this.performAudit(
            context, 
            specializedAction ? { ...auditOptions, action: specializedAction } : undefined, 
            error, 
            'FAILURE'
          );
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
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url, ip, headers } = request;
    const user = request.user;

    // Determine action name
    let action = options?.action || `${method}:${url}`;
    if (resultStatus === 'FAILURE') {
      action = `${action}_FAILED`;
    }

    const entityType = options?.entityType || 'api_request';

    // Extract entityId if possible from params or body
    const params = request.params as Record<string, unknown>;
    const body = request.body as Record<string, unknown>;

    const entityId =
      (params?.id as string) ||
      (body?.id as string) ||
      (body?.subdomain as string) ||
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
            ? {
                error:
                  (resultData as { message?: string })?.message ||
                  String(resultData),
              }
            : {}),
        },
      });
    } catch (err) {
      // Fail-safe: don't crash the request if auditing fails, but log it
      process.stderr.write(`S4 Auditing Failed: ${String(err)}\n`);
    }
  }
}
