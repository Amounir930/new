import {
  adminDb,
  eq,
  onboardingBlueprintsInGovernance,
  tenantsInGovernance,
} from '@apex/db';
import type { TenantCacheService } from '@apex/middleware';
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';

@Controller('public/tenants')
export class TenantsPublicController {
  constructor(private readonly tenantCache: TenantCacheService) {}

  /**
   * S2.5: Discovery API for Storefronts
   * Returns metadata required for SDUI and Theme initialization
   */
  @Get('discovery/:subdomain')
  async discover(@Param('subdomain') subdomain: string) {
    // Protocol S11: Redis Cache Lookup (Performance Guardrail)
    const cacheKey = `discovery:${subdomain.toLowerCase()}`;
    const cached = await (this.tenantCache as any).redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    const [tenant] = await adminDb
      .select()
      .from(tenantsInGovernance)
      .where(eq(tenantsInGovernance.subdomain, subdomain))
      .limit(1);

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException(
        `Tenant with subdomain ${subdomain} not found`
      );
    }

    // S2.5 Lockdown: Only active tenants are allowed to serve storefronts
    if (tenant.status !== 'active') {
      throw new ForbiddenException(
        `Access denied: Tenant ${subdomain} is ${tenant.status}`
      );
    }

    let uiConfig = tenant.uiConfig as Record<string, unknown> | null;
    const nicheType = tenant.nicheType;

    // S2.5: Registry Join Logic
    // If tenant has no custom config, fallback to the global blueprint for that niche
    if ((!uiConfig || Object.keys(uiConfig).length === 0) && nicheType) {
      const [blueprint] = await adminDb
        .select({ uiConfig: onboardingBlueprintsInGovernance.uiConfig })
        .from(onboardingBlueprintsInGovernance)
        .where(
          eq(
            onboardingBlueprintsInGovernance.nicheType,
            nicheType as
              | 'retail'
              | 'wellness'
              | 'education'
              | 'services'
              | 'hospitality'
              | 'real-estate'
              | 'creative'
          )
        )
        .limit(1);

      if (blueprint?.uiConfig) {
        uiConfig = blueprint.uiConfig as Record<string, unknown>;
      }
    }

    const result = {
      subdomain: tenant.subdomain,
      nicheType,
      uiConfig: uiConfig || {},
    };

    // Protocol S11: Cache Discovery Result (TTL: 1 Hour)
    await (this.tenantCache as any).redis.set(
      cacheKey,
      JSON.stringify(result),
      {
        EX: 3600,
      }
    );

    return result;
  }
}
