import { AuditLog } from '@apex/audit';
import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import {
  adminDb,
  and,
  count,
  eq,
  featureGatesInGovernance,
  sql,
  tenantsInGovernance,
} from '@apex/db';
import type { DrizzleExecutor } from '@apex/middleware';
import { TenantCacheService } from '@apex/middleware';
import { decrypt, type EncryptedData } from '@apex/security';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { ProvisioningService } from '../provisioning/provisioning.service';
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
    @Inject('SECURITY_SERVICE')
    private readonly security: SecurityService,
    @Inject('PROVISIONING_SERVICE')
    private readonly provisioningService: ProvisioningService,
    @Inject('TENANT_CACHE_SERVICE')
    private readonly cache: TenantCacheService
  ) {}

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const sanitizedLimit = Math.min(limit, 100); // S12: Guard against mass PII scraping

      const { data, total } = await adminDb.transaction(async (tx) => {
        // S2/FIX: Set local sovereign context to bypass RLS for this transaction only
        // This prevents connection pool contamination (S1-S15 Mandate)
        await tx.execute(sql`SET LOCAL app.is_super_admin = 'true'`);

        const [totalResult] = await tx
          .select({ value: count() })
          .from(tenantsInGovernance);
        const totalCount = Number(totalResult?.value || 0);

        const tenantRecords = await tx
          .select()
          .from(tenantsInGovernance)
          .limit(sanitizedLimit)
          .offset(offset);

        return {
          data: tenantRecords.map((t) => ({
            ...t,
            ownerEmail: this.safeDecrypt(
              t.ownerEmail as string | EncryptedData | null
            ),
          })),
          total: totalCount,
        };
      });

      return {
        data,
        meta: {
          total,
          page: Number(page),
          lastPage: Math.ceil(total / sanitizedLimit),
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `[TENANT_FIND_ALL_ERROR] ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await adminDb.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL app.is_super_admin = 'true'`);
        const [tenant] = await tx
          .select()
          .from(tenantsInGovernance)
          .where(eq(tenantsInGovernance.id, id))
          .limit(1);

        if (!tenant) {
          throw new Error('Tenant not found');
        }

        return {
          ...tenant,
          ownerEmail: this.safeDecrypt(
            tenant.ownerEmail as string | EncryptedData | null
          ),
        };
      });
    } catch (error: unknown) {
      this.logger.error(
        `[TENANT_FIND_ONE_ERROR] ${error instanceof Error ? error.message : String(error)}`
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
      throw new BadRequestException(`Invalid feature key: ${key}`);
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
      // S2/FIX: Set local sovereign context
      await tx.execute(sql`SET LOCAL app.is_super_admin = 'true'`);

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
          tx as unknown as DrizzleExecutor
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
      // 1. Initial State Transition & Fetch (Inside Transaction for RLS Bypass)
      // This locks the tenant in governance and signals start of destruction
      const tenant = await adminDb.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL app.is_super_admin = 'true'`);

        const [t] = await tx
          .select()
          .from(tenantsInGovernance)
          .where(eq(tenantsInGovernance.id, id))
          .limit(1);

        if (!t) {
          throw new Error('Tenant not found');
        }

        await tx
          .update(tenantsInGovernance)
          .set({ status: 'purging', updatedAt: new Date().toISOString() })
          .where(eq(tenantsInGovernance.id, id));

        return t;
      });

      this.logger.warn(
        `[SAGA_DELETION] Initiated purge for ${tenant.subdomain}`
      );

      // 2. Physical Purge (Outside Transaction - External Systems: MinIO, Redis, Schema)
      // This prevents the "Zombie Tenant" trap where database rolls back but assets are gone.
      await this.provisioningService.deprovisionTenant(tenant.subdomain);

      // 3. Logical Burial (Inside New Transaction for RLS Bypass)
      // S4 Protocol: We retain the record with deleted_at for Audit/Security history.
      await adminDb.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL app.is_super_admin = 'true'`);

        await tx
          .update(tenantsInGovernance)
          .set({
            status: 'deleted', // Final dead state
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(tenantsInGovernance.id, id));
      });

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

  private safeDecrypt(
    email: string | EncryptedData | null | undefined
  ): string | null {
    if (!email) return null;
    if (typeof email === 'string') return email; // Legacy unencrypted string
    try {
      const data = email as EncryptedData;
      // Protocol S7: Check for essential structure before attempting decryption
      if (!data.enc || !data.iv || !data.tag) {
        return `[MALFORMED_DATA]`;
      }

      // Forensic Hardening: Handle cases where 'data' is malformed (e.g., string instead of object)
      // This specifically prevents the client-side crash observed in Super Admin
      if (typeof data.data !== 'object' || data.data === null) {
        this.logger.debug(
          `[PII_DECRYPT_FAIL] Invalid metadata structure for record. Expected object, got ${typeof data.data}`
        );
        return `[INCOMPATIBLE_ENCRYPTION_V0]`;
      }

      return decrypt(data);
    } catch (error: unknown) {
      this.logger.debug(
        `[PII_DECRYPT_FAIL] Failed to decrypt owner email: ${error instanceof Error ? error.message : String(error)}`
      );
      // Fallback for UI stability: Return masked or placeholder data
      return `[SECURE_DATA_UNAVAILABLE]`;
    }
  }
}
