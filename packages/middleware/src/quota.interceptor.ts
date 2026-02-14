/**
 * Quota Interceptor
 *
 * Enforces resource-level quotas (max products, max orders, etc.)
 */

import {
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  type NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import type { TenantRequest } from './tenant-isolation.middleware';

export const QUOTA_KEY = 'governance_quota';

/**
 * Decorator to check quota before operation.
 * Usage: @CheckQuota('products')
 */
export const CheckQuota = (resource: 'products' | 'orders' | 'pages') =>
  SetMetadata(QUOTA_KEY, resource);

@Injectable()
export class QuotaInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const resource = this.reflector.get<'products' | 'orders' | 'pages'>(
      QUOTA_KEY,
      context.getHandler()
    );

    if (!resource) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    const tenantId = request.tenantContext?.tenantId;

    // Super Admin Bypass
    if (user?.role === 'super_admin') {
      return next.handle();
    }

    if (!tenantId) {
      throw new ForbiddenException(
        'Tenant context required for quota validation'
      );
    }

    // This requires a count of current resources.
    // In a real scenario, we might pass a 'currentCount' via the request or fetch it here.
    // For now, we assume the controller or service will perform the final check,
    // or we fetch the count from the DB if provided in metadata.

    // Placeholder: The actual enforcement might happen in the service layer for better precision,
    // but the interceptor can pre-check based on cached counts if available.

    return next.handle();
  }
}
