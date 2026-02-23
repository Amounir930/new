// biome-ignore lint/style/useImportType: Dependency Injection token
import { TenantRegistryService } from '@apex/db';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditLog, AuditService } from '@apex/audit';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import { SecurityService } from '../security/security.service.js';

const UpdateTenantSchema = z.object({
  plan: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  nicheType: z.string().optional(),
});

const UpdateFeatureSchema = z.object({
  isEnabled: z.boolean(),
});

import { forwardRef } from '@nestjs/common';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
  constructor(
    private readonly tenantRegistry: TenantRegistryService,
    @Inject(forwardRef(() => SecurityService))
    private readonly security: SecurityService,
    @Inject('AUDIT_SERVICE')
    private readonly audit: AuditService
  ) { }

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
  @AuditLog({ action: 'TENANT_FEATURE_UPDATED', entityType: 'tenant' })
  async updateFeature(
    @Param('id') id: string,
    @Param('key') key: string,
    @Body(new ZodValidationPipe(UpdateFeatureSchema)) body: { isEnabled: boolean }
  ) {
    // S3: Validate feature key against known master list
    const MASTER_FEATURES = ['analytics', 'custom-domains', 'api-access', 'bulk-import', 'advanced-seo'];
    if (!MASTER_FEATURES.includes(key)) {
      throw new Error(`Invalid feature key: ${key}`);
    }

    const { governanceService } = await import('@apex/db');
    return governanceService.updateTenantFeatureGate(id, key, body.isEnabled);
  }

  @Patch(':id')
  @AuditLog({ action: 'TENANT_UPDATED', entityType: 'tenant' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTenantSchema))
    body: {
      plan?: string;
      name?: string;
      status?: string;
      nicheType?: string;
    }
  ) {
    const updated = await this.tenantRegistry.update(id, body);

    // S15: Steel Control Sync
    // If status changed, update the global Redis lock for instant enforcement
    if (body.status) {
      await this.security.setTenantLock(updated.subdomain, body.status === 'suspended');
    }

    // S21: If plan or niche changed, we might want to suggest a re-sync or
    // automate it. For now, we return the updated tenant.
    return updated;
  }
}
