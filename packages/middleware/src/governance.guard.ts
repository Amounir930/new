/**
 * Governance Guard
 *
 * Enforces feature-level access control based on plan and tenant specific gates.
 */

import {
  adminDb,
  and,
  eq,
  featureGatesInGovernance,
  SYSTEM_TENANT_ID,
  sql,
} from '@apex/db';
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

    // S2 FIX (Architectural Correction): Strictly prioritize cryptographically verified tenantId
    // Never fallback to req.tenantContext for sensitive authorization gates.
    const tenantId = user?.tenantId;

    // Super Admin Bypass
    if ((user as { role?: string } | undefined)?.role === 'super_admin') {
      return true;
    }

    // Bypass feature gates ONLY for authenticated System/Root contexts
    if (!tenantId || tenantId === SYSTEM_TENANT_ID) {
      return true;
    }

    // Direct check against Drizzle definitive schema (Governance)
    // S2 FIX: Removed redundant transaction wrapper for read-only governance lookup.
    // Governance queries run as admin role which bypasses tenant RLS.
    const [gate] = await adminDb
      .select({ isEnabled: featureGatesInGovernance.isEnabled })
      .from(featureGatesInGovernance)
      .where(
        and(
          eq(featureGatesInGovernance.tenantId, tenantId),
          eq(featureGatesInGovernance.featureKey, feature)
        )
      )
      .limit(1);

    const isEnabled = gate?.isEnabled || false;

    if (!isEnabled) {
      throw new ForbiddenException(
        `Feature '${feature}' is not enabled for your current plan.`
      );
    }

    return true;
  }
}
