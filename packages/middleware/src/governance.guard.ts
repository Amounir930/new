/**
 * Governance Guard
 *
 * Enforces feature-level access control based on plan and tenant specific gates.
 */

import type { GovernanceService } from '@apex/db';
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
  constructor(
    private reflector: Reflector,
    private governanceService: GovernanceService
  ) {}

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
    const tenantId = request.tenantContext?.tenantId;

    // Super Admin Bypass
    if (user?.role === 'super_admin') {
      return true;
    }

    if (!tenantId) {
      throw new ForbiddenException(
        'Tenant context required for feature validation'
      );
    }

    const isEnabled = await this.governanceService.isFeatureEnabled(
      tenantId,
      feature
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `Feature '${feature}' is not enabled for your current plan.`
      );
    }

    return true;
  }
}
