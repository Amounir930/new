/**
 * Quota Interceptor
 *
 * Enforces resource-level quotas (max products, max orders, etc.)
 */

import { GovernanceService } from '@apex/db';
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
export const CheckQuota = (resource: 'products' | 'orders' | 'staff') =>
  SetMetadata(QUOTA_KEY, resource);

@Injectable()
export class QuotaInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private governanceService: GovernanceService
  ) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const resource = this.reflector.get<'products' | 'orders' | 'staff'>(
      QUOTA_KEY,
      context.getHandler()
    );

    if (!resource) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    const tenantId = request.tenantContext?.tenantId;
    const subdomain = request.tenantContext?.subdomain;

    // Super Admin Bypass
    if (user?.role === 'super_admin') {
      return next.handle();
    }

    if (!tenantId || !subdomain) {
      throw new ForbiddenException(
        'Tenant context required for quota validation'
      );
    }

    const result = await this.governanceService.checkQuota(
      tenantId,
      resource,
      subdomain
    );

    if (!result.allowed) {
      throw new ForbiddenException(
        `Quota exceeded for '${resource}'. Limit: ${result.limit}, Current: ${result.current}. Please upgrade your plan.`
      );
    }

    return next.handle();
  }
}
