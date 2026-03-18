import {
  JwtAuthGuard,
  TenantJwtMatchGuard,
  type TenantRequest,
} from '@apex/auth';
import { 
  getTenantDb, 
  tenantConfigInStorefront, 
  adminDb, 
  tenantsInGovernance, 
  eq 
} from '@apex/db';
import { RedisRateLimitStore } from '@apex/middleware';
import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

const UpdateConfigSchema = z.object({
  store_name: z.string().min(1).max(100).optional(),
  logo_url: z.string().url().optional(),
});

@Controller('merchant/config')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class MerchantConfigController {
  constructor(private readonly redisStore: RedisRateLimitStore) {}

  /**
   * Phase 1: DB Context Reconciliation
   * Fetches the tenant's isolated schema name from governance
   */
  private async getResolvedTenantDb(tenantId: string) {
    const [tenant] = await adminDb
      .select({ subdomain: tenantsInGovernance.subdomain })
      .from(tenantsInGovernance)
      .where(eq(tenantsInGovernance.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Merchant tenant not found in governance');
    }

    // Explicitly route to isolated physical schema (S2 Mandate)
    return getTenantDb(tenantId, `tenant_${tenant.subdomain}`);
  }

  @Get()
  async getConfig(@Req() req: TenantRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }

    const { db, release } = await this.getResolvedTenantDb(tenantId);
    try {
      const configEntries = await db.select().from(tenantConfigInStorefront);

      const config = configEntries.reduce(
        (acc: Record<string, unknown>, curr: Record<string, unknown>) => {
          if (typeof curr.key === 'string') acc[curr.key] = curr.value;
          return acc;
        },
        {} as Record<string, unknown>
      );

      return {
        store_name: (config.store_name as string) || '',
        logo_url: (config.logo_url as string) || '',
      };
    } finally {
      await release();
    }
  }

  @Patch()
  async updateConfig(
    @Req() req: TenantRequest,
    @Body(new ZodValidationPipe(UpdateConfigSchema)) body: z.infer<
      typeof UpdateConfigSchema
    >
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }

    const { db, release } = await this.getResolvedTenantDb(tenantId);
    try {
      // S2 Fix: Ensure all operations use the transaction 'tx' to stay within scope
      await db.transaction(async (tx) => {
        if (body.store_name) {
          await tx
            .insert(tenantConfigInStorefront)
            .values({
              key: 'store_name',
              value: body.store_name,
              updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: tenantConfigInStorefront.key,
              set: {
                value: body.store_name,
                updatedAt: new Date().toISOString(),
              },
            });
        }

        if (body.logo_url) {
          await tx
            .insert(tenantConfigInStorefront)
            .values({
              key: 'logo_url',
              value: body.logo_url,
              updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: tenantConfigInStorefront.key,
              set: {
                value: body.logo_url,
                updatedAt: new Date().toISOString(),
              },
            });
        }
      });
    } finally {
      await release();
    }

    // Surgical Cache Invalidation (S12 Mandate)
    const client = await this.redisStore.getClient();
    if (client) {
      await Promise.all([
        client.del(`storefront:home:${tenantId}`),
        client.del(`storefront:config:${tenantId}`),
        client.del(`storefront:bootstrap:${tenantId}`),
      ]);
    }

    return { success: true };
  }
}
