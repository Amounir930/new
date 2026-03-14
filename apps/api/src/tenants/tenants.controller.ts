import { AuditLog } from '@apex/audit';
import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import {
  adminDb,
  and,
  eq,
  featureGatesInGovernance,
  tenantsInGovernance,
} from '@apex/db';
import type { TenantCacheService } from '@apex/middleware';
import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import type { ProvisioningService } from '../provisioning/provisioning.service';
import { SecurityService } from '../security/security.service';

const UpdateTenantSchema = z.object({
  plan: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  nicheType: z.string().optional(),
});

const UpdateFeatureSchema = z.object({
  isEnabled: z.boolean(),
});

@Controller('tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(
    @Inject(forwardRef(() => SecurityService))
    private readonly security: SecurityService,
    @Inject('PROVISIONING_SERVICE')
    private readonly provisioningService: ProvisioningService,
    private readonly cache: TenantCacheService
  ) {}

  @Get()
  async findAll() {
    try {
      return await adminDb.select().from(tenantsInGovernance);
    } catch (error: unknown) {
      this.logger.error(
        `[TENANT_FIND_ALL_ERROR] ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
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
    let subdomain = '';
    const updated = await adminDb.transaction(async (tx) => {
      const [updatedRecord] = await tx
        .update(tenantsInGovernance)
        .set({
          ...body,
          status: body.status as
            | 'active'
            | 'pending'
            | 'suspended'
            | 'archived'
            | undefined,
          plan: body.plan as
            | 'free'
            | 'basic'
            | 'pro'
            | 'enterprise'
            | undefined,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tenantsInGovernance.id, id))
        .returning();

      if (!updatedRecord) {
        throw new Error('Tenant not found');
      }

      subdomain = updatedRecord.subdomain;

      // S15: Steel Control Sync
      // If status changed, update the global Redis lock for instant enforcement
      if (body.status) {
        await this.security.setTenantLock(
          updatedRecord.subdomain,
          body.status === 'suspended'
        );
      }

      // Phase 13: Sovereign Governance Sync (ACID Mandate)
      // If plan or niche changed, synchronize physical enforcements
      if (body.plan || body.nicheType) {
        await this.provisioningService.synchronizeTenantGovernance(
          subdomain,
          tx as any
        );
      }

      return updatedRecord;
    });

    // Post-Commit Invalidation: Clear Cache Strictly AFTER Transaction Success
    if (subdomain) {
      await this.cache.invalidateTenant(subdomain);
      this.logger.log(`[SOVEREIGN_CACHE] Invalidated cache for ${subdomain}`);
    }

    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      // 1. Fetch tenant to get subdomain
      const [tenant] = await adminDb
        .select()
        .from(tenantsInGovernance)
        .where(eq(tenantsInGovernance.id, id))
        .limit(1);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Step 2: State Machine - Initial Transition (Purging)
      // This locks the tenant in governance and signals start of destruction
      await adminDb
        .update(tenantsInGovernance)
        .set({ status: 'purging', updatedAt: new Date().toISOString() })
        .where(eq(tenantsInGovernance.id, id));

      this.logger.warn(
        `[SAGA_DELETION] Initiated purge for ${tenant.subdomain}`
      );

      // Step 3: Physical Purge (Extermination of Schema/Bucket/Locks)
      await this.provisioningService.deprovisionTenant(tenant.subdomain);

      // Step 4: Logical Burial (Soft Delete)
      // S4 Protocol: We retain the record with deleted_at for Audit/Security history.
      const [_deleted] = await adminDb
        .update(tenantsInGovernance)
        .set({
          status: 'deleted', // Final dead state
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tenantsInGovernance.id, id))
        .returning();

      this.logger.log(
        `[SAGA_DELETION] Successfully buried tenant: ${tenant.subdomain}`
      );

      return {
        success: true,
        message: 'Tenant physical assets purged and record archived.',
        tenantId: id,
      };
    } catch (error: unknown) {
      this.logger.error(
        `[SAGA_DELETE_ERROR] ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
