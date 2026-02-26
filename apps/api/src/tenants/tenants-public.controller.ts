// biome-ignore lint/style/useImportType: Dependency Injection token
import { TenantRegistryService } from '@apex/db';
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

@Controller('public/tenants')
export class TenantsPublicController {
  constructor(private readonly tenantRegistry: TenantRegistryService) {}

  /**
   * S2.5: Discovery API for Storefronts
   * Returns metadata required for SDUI and Theme initialization
   */
  @Get('discovery/:subdomain')
  async discover(@Param('subdomain') subdomain: string) {
    const tenant = await this.tenantRegistry.getBySubdomain(subdomain);

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with subdomain ${subdomain} not found`
      );
    }

    let uiConfig = tenant.uiConfig as Record<string, unknown> | null;
    const nicheType = tenant.nicheType;

    // S2.5: Registry Join Logic
    // If tenant has no custom config, fallback to the global blueprint for that niche
    if ((!uiConfig || Object.keys(uiConfig).length === 0) && nicheType) {
      const blueprintConfig =
        await this.tenantRegistry.getBlueprintConfig(nicheType);
      if (blueprintConfig) {
        uiConfig = blueprintConfig;
      }
    }

    return {
      subdomain: tenant.subdomain,
      nicheType,
      uiConfig: uiConfig || {},
    };
  }
}
