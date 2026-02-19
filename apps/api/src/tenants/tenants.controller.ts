// biome-ignore lint/style/useImportType: Dependency Injection token
import { TenantRegistryService } from '@apex/db';
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../../../../packages/auth/src/guards/super-admin.guard.js';
import { JwtAuthGuard } from '../../../../packages/auth/src/index.js';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
  constructor(private readonly tenantRegistry: TenantRegistryService) {}

  @Get()
  async findAll() {
    return this.tenantRegistry.findAll();
  }

  @Get(':id/features')
  async getFeatures(@Param('id') id: string) {
    const { governanceService } = await import('@apex/db');
    const gates = await governanceService.getTenantFeatureGates(id);

    // Resolve effective state
    const features: Record<
      string,
      { enabled: boolean; source: 'plan' | 'tenant' }
    > = {};

    for (const gate of gates) {
      if (!features[gate.featureKey] || gate.tenantId === id) {
        features[gate.featureKey] = {
          enabled: !!gate.isEnabled,
          source: gate.tenantId === id ? 'tenant' : 'plan',
        };
      }
    }

    return features;
  }

  @Patch(':id/features/:key')
  async updateFeature(
    @Param('id') id: string,
    @Param('key') key: string,
    @Body() body: { isEnabled: boolean }
  ) {
    const { governanceService } = await import('@apex/db');
    return governanceService.updateTenantFeatureGate(id, key, body.isEnabled);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      plan?: string;
      name?: string;
      status?: string;
      nicheType?: string;
    }
  ) {
    const updated = await this.tenantRegistry.update(id, body);

    // S21: If plan or niche changed, we might want to suggest a re-sync or
    // automate it. For now, we return the updated tenant.
    return updated;
  }
}
