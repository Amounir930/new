/**
 * Governance Guard
 *
 * Enforces feature-level access control based on plan and tenant specific gates.
 */

import { SYSTEM_TENANT_ID, adminDb, and, eq, featureGatesInGovernance, sql } from '@apex/db';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { Reflector } from '@nestjs/core';
import type { TenantRequest } from './tenant-isolation.middleware';

export const FEATURE_KEY = 'governance_feature';

/**
 * Decorator to require a specific feature for a route.
 * Usage: @RequireFeature('ai_personalization')
 */
export const RequireFeature = (feature: string) =>
  SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class GovernanceGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<string>(
      FEATURE_KEY,
      context.getHandler()
    );

    // If no feature is required, allow access
    if (!feature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    
    // ROOT CAUSE FIX: Read tenantId from cryptographically verified JWT authority
    // NOT from the middleware's domain resolution (which sets 'system' for admin domains)
    const tenantId = user?.tenantId;

    // Super Admin Bypass
    if ((user as { role?: string } | undefined)?.role === 'super_admin') {
      return true;
    }

    // Bypass feature gates for System contexts
    if (!tenantId || tenantId === SYSTEM_TENANT_ID) {
      return true;
    }

    // Direct check against Drizzle definitive schema
    // S2 FIX: Use strict transaction block to maintain RLS session context
    const isEnabled = await adminDb.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
      );

      const [gate] = await tx
        .select({ isEnabled: featureGatesInGovernance.isEnabled })
        .from(featureGatesInGovernance)
        .where(
          and(
            eq(featureGatesInGovernance.tenantId, tenantId),
            eq(featureGatesInGovernance.featureKey, feature)
          )
        )
        .limit(1);

      return gate?.isEnabled || false;
    });

    if (!isEnabled) {
      throw new ForbiddenException(
        `Feature '${feature}' is not enabled for your current plan.`
      );
    }

    return true;
  }
}
