import { AuditLog } from '@apex/audit';
import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import {
  adminDb,
  and,
  eq,
  featureGatesInGovernance,
  tenantsInGovernance,
} from '@apex/db';
import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
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

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
  constructor(
    @Inject(forwardRef(() => SecurityService))
    private readonly security: SecurityService
  ) {}

  @Get()
  async findAll() {
    return adminDb.select().from(tenantsInGovernance);
  }

  @Get(':id/features')
  async getFeatures(@Param('id') id: string) {
    const gates = await adminDb
      .select()
      .from(featureGatesInGovernance)
      .where(eq(featureGatesInGovernance.tenantId, id));

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
    @Body(new ZodValidationPipe(UpdateFeatureSchema)) body: {
      isEnabled: boolean;
    }
  ) {
    // S3: Validate feature key against known master list
    const MASTER_FEATURES = [
      'analytics',
      'custom-domains',
      'api-access',
      'bulk-import',
      'advanced-seo',
    ];
    if (!MASTER_FEATURES.includes(key)) {
      throw new Error(`Invalid feature key: ${key}`);
    }

    const [existing] = await adminDb
      .select()
      .from(featureGatesInGovernance)
      .where(
        and(
          eq(featureGatesInGovernance.tenantId, id),
          eq(featureGatesInGovernance.featureKey, key)
        )
      )
      .limit(1);

    if (existing) {
      return adminDb
        .update(featureGatesInGovernance)
        .set({ isEnabled: body.isEnabled })
        .where(eq(featureGatesInGovernance.id, existing.id))
        .returning();
    }

    return adminDb
      .insert(featureGatesInGovernance)
      .values({
        tenantId: id,
        featureKey: key,
        isEnabled: body.isEnabled,
      })
      .returning();
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
    const [updated] = await adminDb
      .update(tenantsInGovernance)
      .set({
        ...body,
        status: body.status as any,
        plan: body.plan as any,
        updatedAt: new Date().toISOString() as any,
      })
      .where(eq(tenantsInGovernance.id, id))
      .returning();

    // S15: Steel Control Sync
    // If status changed, update the global Redis lock for instant enforcement
    if (body.status) {
      await this.security.setTenantLock(
        updated.subdomain,
        body.status === 'suspended'
      );
    }

    // S21: If plan or niche changed, we might want to suggest a re-sync or
    // automate it. For now, we return the updated tenant.
    return updated;
  }
}
