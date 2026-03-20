import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import type { AuthenticatedRequest } from '@apex/auth';

interface RequestWithLogger extends AuthenticatedRequest {
  log?: {
    warn: (message: string, meta?: Record<string, unknown>) => void;
  };
  auditTenantId?: string;
}
import { 
  getTenantDb, 
  tenantConfigInStorefront,
  eq,
} from '@apex/db';
import { RedisRateLimitStore, TenantCacheService } from '@apex/middleware';
import { env } from '@apex/config';
import { deleteObject } from '@apex/provisioning';
import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  NotFoundException,
  Inject,
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
  constructor(
    private readonly redisStore: RedisRateLimitStore,
    @Inject('TENANT_CACHE_SERVICE')
    private readonly tenantCache: TenantCacheService
  ) {}

  @Get()
  async getConfig(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }
    (req as RequestWithLogger).auditTenantId = tenantId;

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
    (req as RequestWithLogger).auditTenantId = tenantId;

    const schemaName = req.tenantContext?.schemaName;
    if (!schemaName) {
      throw new Error('S1 PROTECT: Schema context missing in authenticated route');
    }
    const { db, release } = await getTenantDb(tenantId, schemaName);

    // S2 Fix: Explicitly resolve subdomain via TenantCacheService to fix lexical scope trap
    const tenantContext = await this.tenantCache.resolveTenantById(tenantId);
    const resolvedSubdomain = tenantContext?.subdomain;

    if (!resolvedSubdomain) {
      this.tenantCache.invalidateTenant(tenantId); // Force discovery refresh on failure
      throw new NotFoundException(`S2 Error: Could not resolve subdomain for tenant ${tenantId}`);
    }

    try {
      // Step 1: Pre-fetch current logo for garbage collection before update
      const existingConfig = await db
        .select()
        .from(tenantConfigInStorefront)
        .where(eq(tenantConfigInStorefront.key, 'logo_url'))
        .limit(1);
      
      const oldLogoUrl = existingConfig[0]?.value as string | undefined;

      // Step 2 & 3: Atomic update into the merchant's isolated schema
      await db.transaction(async (tx) => {
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
          // Vector 2: Physical Garbage Collection of orphaned assets
          if (oldLogoUrl && oldLogoUrl !== body.logo_url) {
            try {
              const bucketName = `tenant-${resolvedSubdomain.toLowerCase()}-assets`;
              if (oldLogoUrl.includes(bucketName)) {
                const key = oldLogoUrl.split(`${bucketName}/`)[1];
                if (key) {
                  await deleteObject(resolvedSubdomain, key);
                }
              }
            } catch (e) {
              const loggerReq = req as RequestWithLogger;
              if (loggerReq.log?.warn) {
                loggerReq.log.warn('Storage GC Failed', { error: (e as Error).message, oldLogoUrl });
              }
            }
          }

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

      // Step 4: Backend Cache Purge (Redis Vector 3 + Discovery Fix)
      try {
        const client = await this.redisStore.getClient();
        if (client) {
          await Promise.all([
            client.del(`storefront:config:${tenantId}`),
            client.del(`storefront:home:${tenantId}`),
            client.del(`storefront:bootstrap:${tenantId}`),
            client.del(`discovery:${resolvedSubdomain.toLowerCase()}`),
          ]);
        }
      } catch (e) {
        const loggerReq = req as RequestWithLogger;
        if (loggerReq.log?.warn) {
          loggerReq.log.warn('Redis Cache Purge Failed', { error: (e as Error).message });
        }
      }

      // Step 5: Frontend ISR Purge (Vector 4 Trigger: Standardized to Subdomain)
      try {
        const revalidateUrl = `http://store:3002/api/revalidate?tag=tenant-${resolvedSubdomain}&secret=${env.INTERNAL_API_SECRET}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        fetch(revalidateUrl, { signal: controller.signal })
          .catch(e => {
            const loggerReq = req as RequestWithLogger;
            if (loggerReq.log?.warn) {
              loggerReq.log.warn('Revalidation Trigger Failed', { error: e.message });
            }
          })
          .finally(() => clearTimeout(timeout));
      } catch (e) {
        // S5: Fail-Safe
      }

      return { success: true };
    } finally {
      release();
    }
  }
}
