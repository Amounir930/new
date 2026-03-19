import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import type { AuthenticatedRequest } from '@apex/auth';
import { 
  getTenantDb, 
  tenantConfigInStorefront,
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
  logo_url: z.string().url().or(z.literal('')).or(z.null()).optional(),
});

@Controller('merchant/config')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class MerchantConfigController {
  constructor(private readonly redisStore: RedisRateLimitStore) {}

  @Get()
  async getConfig(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }
    (req as any).auditTenantId = tenantId;

    const schemaName = req.tenantContext?.schemaName;
    if (!schemaName) {
      throw new Error('S1 PROTECT: Schema context missing in authenticated route');
    }

    const { db, release } = await getTenantDb(tenantId, schemaName);
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
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UpdateConfigSchema)) body: z.infer<
      typeof UpdateConfigSchema
    >
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }
    (req as any).auditTenantId = tenantId;

    const schemaName = req.tenantContext?.schemaName;
    if (!schemaName) {
      throw new Error('S1 PROTECT: Schema context missing in authenticated route');
    }
    const { db, release } = await getTenantDb(tenantId, schemaName);
    try {
      // S2 Isolation: Explicit insertion/update into the merchant's isolated schema
      await db.transaction(async (tx) => {
        // De-falsification: Check for property existence (!== undefined), not truthiness
        if (body.store_name !== undefined) {
          await tx
            .insert(tenantConfigInStorefront)
            .values({
              key: 'store_name',
              value: body.store_name,
            })
            .onConflictDoUpdate({
              target: tenantConfigInStorefront.key,
              set: { value: body.store_name },
            });
        }

        if (body.logo_url !== undefined) {
          await tx
            .insert(tenantConfigInStorefront)
            .values({
              key: 'logo_url',
              value: body.logo_url ?? '',
            })
            .onConflictDoUpdate({
              target: tenantConfigInStorefront.key,
              set: { value: body.logo_url ?? '' },
            });
        }
      });

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
    } finally {
      await release();
    }
  }
}
