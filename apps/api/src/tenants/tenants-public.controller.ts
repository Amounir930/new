import {
  adminDb,
  eq,
  onboardingBlueprintsInGovernance,
  tenantsInGovernance,
} from '@apex/db';
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';

@Controller('public/tenants')
export class TenantsPublicController {
  /**
   * S2.5: Discovery API for Storefronts
   * Returns metadata required for SDUI and Theme initialization
   */
  @Get('discovery/:subdomain')
  async discover(@Param('subdomain') subdomain: string) {
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

    return {
      subdomain: tenant.subdomain,
      nicheType,
      uiConfig: uiConfig || {},
    };
  }
}
