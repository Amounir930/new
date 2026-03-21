import type { AuthenticatedRequest } from '@apex/auth';
import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';

interface RequestWithLogger extends AuthenticatedRequest {
  log?: {
    warn: (message: string, meta?: Record<string, unknown>) => void;
  };
  auditTenantId?: string;
}

import { env } from '@apex/config';
import { eq, getTenantDb, tenantConfigInStorefront } from '@apex/db';
import type { RedisRateLimitStore, TenantCacheService } from '@apex/middleware';
import { deleteObject } from '@apex/provisioning';
import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
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
      throw new Error(
        'S1 PROTECT: Schema context missing in authenticated route'
      );
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
      throw new Error(
        'S1 PROTECT: Schema context missing in authenticated route'
      );
    }
    const { db, release } = await getTenantDb(tenantId, schemaName);

    // S2 Fix: Explicitly resolve subdomain via TenantCacheService to fix lexical scope trap
    const tenantContext = await this.tenantCache.resolveTenantById(tenantId);
    const resolvedSubdomain = tenantContext?.subdomain;

    if (!resolvedSubdomain) {
      this.tenantCache.invalidateTenant(tenantId); // Force discovery refresh on failure
      throw new NotFoundException(
        `S2 Error: Could not resolve subdomain for tenant ${tenantId}`
      );
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
            .values({ key: 'store_name', value: body.store_name })
            .onConflictDoUpdate({
              target: tenantConfigInStorefront.key,
              set: { value: body.store_name },
            });
        }

        if (body.logo_url !== undefined) {
          await this.executeStorageGc(
            resolvedSubdomain,
            oldLogoUrl,
            body.logo_url,
            req as RequestWithLogger
          );

          await tx
            .insert(tenantConfigInStorefront)
            .values({ key: 'logo_url', value: body.logo_url ?? '' })
            .onConflictDoUpdate({
              target: tenantConfigInStorefront.key,
              set: { value: body.logo_url ?? '' },
            });
        }
      });

      // Step 4 & 5: Persistence Sync (Redis + ISR)
      await this.syncStorefront(
        tenantId,
        resolvedSubdomain,
        req as RequestWithLogger
      );

      return { success: true };
    } finally {
      release();
    }
  }

  private async executeStorageGc(
    subdomain: string,
    oldUrl: string | undefined,
    newUrl: string,
    req: RequestWithLogger
  ) {
    if (oldUrl && oldUrl !== newUrl) {
      try {
        const bucket = `tenant-${subdomain.toLowerCase()}-assets`;
        if (oldUrl.includes(bucket)) {
          const key = oldUrl.split(`${bucket}/`)[1];
          if (key) await deleteObject(subdomain, key);
        }
      } catch (e) {
        if (req.log?.warn) {
          req.log.warn('Storage GC Failed', {
            error: (e as Error).message,
            oldUrl,
          });
        }
      }
    }
  }

  private async syncStorefront(
    tenantId: string,
    subdomain: string,
    req: RequestWithLogger
  ) {
    try {
      const client = await this.redisStore.getClient();
      if (client) {
        const subLow = subdomain.toLowerCase();
        await Promise.all([
          client.del(`storefront:config:${tenantId}`),
          client.del(`storefront:home:${tenantId}`),
          client.del(`storefront:bootstrap:${tenantId}`),
          client.del(`discovery:${subLow}`),
        ]);
      }
    } catch (e) {
      if (req.log?.warn) {
        req.log.warn('Redis Cache Purge Failed', {
          error: (e as Error).message,
        });
      }
    }

    try {
      const isrUrl = `http://store:3002/api/revalidate?tag=tenant-${subdomain}&secret=${env.INTERNAL_API_SECRET}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      fetch(isrUrl, { signal: controller.signal })
        .catch((e) => {
          if (req.log?.warn) {
            req.log.warn('Revalidation Trigger Failed', { error: e.message });
          }
        })
        .finally(() => clearTimeout(timeout));
    } catch {
      /* S5: Fail-Safe */
    }
  }
}
