/**
 * Quota Interceptor
 *
 * Enforces resource-level quotas (max products, max orders, etc.)
 */

import {
  adminDb,
  count,
  eq,
  ordersInStorefront,
  productsInStorefront,
  staffMembersInStorefront,
  subscriptionPlansInGovernance,
  tenantQuotasInGovernance,
  tenantsInGovernance,
} from '@apex/db';
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
  constructor(private reflector: Reflector) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
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

    // Super Admin Bypass
    if ((user as { role?: string } | undefined)?.role === 'super_admin') {
      return next.handle();
    }

    if (!tenantId) {
      throw new ForbiddenException(
        'Tenant context required for quota validation'
      );
    }

    // 1. Fetch Limits (Plan Defaults + Overrides)
    const [quotaData] = await adminDb
      .select({
        planMaxProducts: subscriptionPlansInGovernance.defaultMaxProducts,
        planMaxOrders: subscriptionPlansInGovernance.defaultMaxOrders,
        planMaxStaff: subscriptionPlansInGovernance.defaultMaxStaff,
        overrideMaxProducts: tenantQuotasInGovernance.maxProducts,
        overrideMaxOrders: tenantQuotasInGovernance.maxOrders,
        overrideMaxStaff: tenantQuotasInGovernance.maxStaff,
      })
      .from(tenantsInGovernance)
      .innerJoin(
        subscriptionPlansInGovernance,
        eq(subscriptionPlansInGovernance.code, tenantsInGovernance.plan)
      )
      .leftJoin(
        tenantQuotasInGovernance,
        eq(tenantQuotasInGovernance.tenantId, tenantsInGovernance.id)
      )
      .where(eq(tenantsInGovernance.id, tenantId))
      .limit(1);

    if (!quotaData) {
      throw new ForbiddenException('Unable to resolve quota data for tenant');
    }

    // 2. Resolve Maximum Limit and Check Usage
    let max = 0;
    let current = 0;

    if (resource === 'products') {
      max = quotaData.overrideMaxProducts ?? quotaData.planMaxProducts;
      const [usageResult] = await adminDb
        .select({ count: count() })
        .from(productsInStorefront)
        .where(eq(productsInStorefront.tenantId, tenantId));
      current = usageResult?.count ?? 0;
    } else if (resource === 'orders') {
      max = quotaData.overrideMaxOrders ?? quotaData.planMaxOrders;
      const [usageResult] = await adminDb
        .select({ count: count() })
        .from(ordersInStorefront)
        .where(eq(ordersInStorefront.tenantId, tenantId));
      current = usageResult?.count ?? 0;
    } else if (resource === 'staff') {
      max = quotaData.overrideMaxStaff ?? quotaData.planMaxStaff;
      const [usageResult] = await adminDb
        .select({ count: count() })
        .from(staffMembersInStorefront)
        .where(eq(staffMembersInStorefront.tenantId, tenantId));
      current = usageResult?.count ?? 0;
    }

    if (current >= max) {
      throw new ForbiddenException(
        `Quota exceeded for '${resource}'. Limit: ${max}, Current: ${current}. Please upgrade your plan.`
      );
    }

    return next.handle();
  }
}
