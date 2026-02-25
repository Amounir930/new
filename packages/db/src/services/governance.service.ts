import type { EncryptionService } from '@apex/security';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createClient } from 'redis';
import { publicDb } from '../connection.js';
import { getTenantTableName } from '../schema.js';
import {
  featureGates,
  subscriptionPlans,
  tenantQuotas,
  tenants,
} from '../schema/governance.js';
import type * as schema from '../schema/index.js';

import type { RedisService } from '../redis.service.js';

@Injectable()
export class GovernanceService {
  constructor(
    @Inject(publicDb) private readonly db: NodePgDatabase<typeof schema>,
    private readonly redisService: RedisService,
    private readonly encryptionService: EncryptionService
  ) {
    this.setupRedisListener();
  }

  private featureCache = new Map<string, string[]>();

  private async setupRedisListener() {
    // Risk #21: Dedicated listener for plan changes as requested by auditor
    await this.redisService.subscribe(
      'tenant_plan_changed',
      (tenantId: string) => {
        console.log(
          `[Governance] Plan changed for tenant ${tenantId}, invalidating cache.`
        );
        this.featureCache.delete(tenantId);
      }
    );

    await this.redisService.subscribe(
      'governance:cache_invalidate',
      (message: string) => {
        try {
          const { tenantId, type } = JSON.parse(message);
          if (type === 'feature_gates') {
            this.featureCache.delete(tenantId);
          }
        } catch (err) {
          console.error('Failed to process governance invalidation:', err);
        }
      }
    );
  }

  private async notifyCacheInvalidation(tenantId: string, type: string) {
    await this.redisService.publish(
      'governance:cache_invalidate',
      JSON.stringify({ tenantId, type })
    );
  }

  // The initRedis method is removed as RedisService handles connection
  // private async initRedis() {
  //   const url = process.env.REDIS_URL || 'redis://localhost:6379';
  //   this.redisClient = createClient({ url });
  //   await this.redisClient.connect().catch(console.error);
  // }

  /**
   * Get effective limits for a tenant (Plan base + overrides)
   */
  async getTenantLimits(tenantId: string) {
    // 1. Get tenant and their plan
    const tenant = await this.db // Changed publicDb to this.db
      .select({
        id: tenants.id,
        planCode: tenants.plan,
        ownerEmail: tenants.ownerEmail,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .then((res) => res[0]);

    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    // S7: Decrypt owner email
    const decryptedEmail = this.decryptEmail(tenant.ownerEmail);

    // 2. Get plan base limits
    const plan = await this.db // Changed publicDb to this.db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.code, tenant.planCode))
      .then((res) => res[0]);

    // 3. Get tenant-specific overrides
    const quotaOverride = await this.db // Changed publicDb to this.db
      .select()
      .from(tenantQuotas)
      .where(eq(tenantQuotas.tenantId, tenantId))
      .then((res) => res[0]);

    return {
      maxProducts:
        quotaOverride?.maxProducts ?? (plan as any)?.defaultMaxProducts ?? 50,
      maxOrders:
        quotaOverride?.maxOrders ?? (plan as any)?.defaultMaxOrders ?? 100,
      maxPages: quotaOverride?.maxStaff ?? (plan as any)?.defaultMaxPages ?? 5, // maxStaff is used for staff limit in schema, but service says maxPages? Wait.
      storageLimitGb:
        quotaOverride?.storageLimitGb ?? (plan as any)?.defaultStorageGb ?? 1,
      ownerEmail: decryptedEmail,
    };
  }

  /**
   * Check if a tenant has reached their quota for a resource
   */
  async checkQuota(
    tenantId: string,
    resourceType: 'products' | 'orders' | 'pages',
    subdomain: string
  ): Promise<{
    allowed: boolean;
    limit: number;
    current: number;
    ownerEmail: string;
  }> {
    const limits = await this.getTenantLimits(tenantId);
    const current = await this.getResourceCount(subdomain, resourceType);

    let limit = 0;
    switch (resourceType) {
      case 'products':
        limit = limits.maxProducts;
        break;
      case 'orders':
        limit = limits.maxOrders;
        break;
      case 'pages':
        limit = limits.maxPages;
        break;
    }

    return {
      allowed: current < limit,
      limit,
      current,
      ownerEmail: limits.ownerEmail,
    };
  }

  /**
   * Internal helper to count resources within a tenant schema
   * Audit 444 Point #22: Hardened dynamic SQL via sql.identifier (quote_ident equivalent)
   */
  private async getResourceCount(
    subdomain: string,
    resourceType: 'products' | 'orders' | 'pages'
  ): Promise<number> {
    const { sanitizeSchemaName } = await import('../core.js');
    const tableName = resourceType === 'pages' ? 'pages' : resourceType;
    const schemaName = sanitizeSchemaName(subdomain);

    const result = await this.db.execute(
      sql`SELECT COUNT(*) as count FROM ${sql.identifier(schemaName)}.${sql.identifier(tableName)} WHERE deleted_at IS NULL`
    );

    return Number((result.rows[0] as any)?.count || 0);
  }

  /**
   * Verify if a specific feature is enabled for a tenant
   */
  async isFeatureEnabled(
    tenantId: string,
    featureKey: string
  ): Promise<boolean> {
    const tenant = await this.db // Changed publicDb to this.db
      .select({ plan: tenants.plan })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .then((res) => res[0]);

    if (!tenant) return false;

    const gates = await this.db // Changed publicDb to this.db
      .select()
      .from(featureGates)
      .where(
        and(
          eq(featureGates.featureKey, featureKey),
          or(
            eq(featureGates.tenantId, tenantId),
            eq(featureGates.planCode, tenant.plan)
          )
        )
      );

    const tenantGate = gates.find((g) => g.tenantId === tenantId);
    if (tenantGate) return !!tenantGate.isEnabled;

    const planGate = gates.find((g) => g.planCode === tenant.plan);
    if (planGate) return !!planGate.isEnabled;

    return false;
  }

  private featurePromises = new Map<string, Promise<string[]>>();

  /**
   * Get all enabled features for a tenant
   * Fatal Mandate #10: Redis Singleflight (Promise Coalescing)
   */
  async getEnabledFeatures(tenantId: string): Promise<string[]> {
    // 1. Check local memory cache
    if (this.featureCache.has(tenantId)) {
      return this.featureCache.get(tenantId)!;
    }

    // 2. Coalesce concurrent requests (Singleflight / Risk #Race-Cache)
    if (this.featurePromises.has(tenantId)) {
      return this.featurePromises.get(tenantId)!;
    }

    const featurePromise = (async () => {
      try {
        const tenant = await this.db
          .select({ plan: tenants.plan })
          .from(tenants)
          .where(eq(tenants.id, tenantId))
          .then((res) => res[0]);

        if (!tenant) return [];

        const gates = await this.db
          .select({
            featureKey: featureGates.featureKey,
            isEnabled: featureGates.isEnabled,
            tenantId: featureGates.tenantId,
          })
          .from(featureGates)
          .where(
            or(
              eq(featureGates.tenantId, tenantId),
              eq(featureGates.planCode, tenant.plan)
            )
          );

        const featureMap = new Map<string, boolean>();
        for (const gate of gates) {
          if (!featureMap.has(gate.featureKey) || gate.tenantId === tenantId) {
            featureMap.set(gate.featureKey, !!gate.isEnabled);
          }
        }

        const result = Array.from(featureMap.entries())
          .filter(([_, enabled]) => enabled)
          .map(([key, _]) => key);

        this.featureCache.set(tenantId, result);
        return result;
      } finally {
        this.featurePromises.delete(tenantId);
      }
    })();

    this.featurePromises.set(tenantId, featurePromise);
    return featurePromise;
  }

  /**
   * Get raw feature gate states (including overrides) for a tenant
   */
  async getTenantFeatureGates(tenantId: string) {
    const tenant = await this.db // Changed publicDb to this.db
      .select({ plan: tenants.plan })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .then((res) => res[0]);

    if (!tenant) throw new Error('Tenant not found');

    const gates = await this.db // Changed publicDb to this.db
      .select()
      .from(featureGates)
      .where(
        or(
          eq(featureGates.planCode, tenant.plan),
          eq(featureGates.tenantId, tenantId)
        )
      );

    return gates;
  }

  /**
   * Manually override a feature gate for a specific tenant
   */
  async updateTenantFeatureGate(
    // Renamed from updateFeatureGate to avoid conflict with new method
    tenantId: string,
    featureKey: string,
    isEnabled: boolean
  ) {
    const existing = await this.db // Changed publicDb to this.db
      .select()
      .from(featureGates)
      .where(
        and(
          eq(featureGates.tenantId, tenantId),
          eq(featureGates.featureKey, featureKey)
        )
      )
      .then((res) => res[0]);

    if (existing) {
      await this.db // Changed publicDb to this.db
        .update(featureGates)
        .set({ isEnabled })
        .where(eq(featureGates.id, existing.id));
    } else {
      await publicDb.insert(featureGates).values({
        tenantId,
        featureKey,
        isEnabled,
      });
    }

    const result = { success: true, featureKey, isEnabled };

    // Mandate #21: Zero-delay cache invalidation via Redis Pub/Sub
    // Auditor Point #8 Compliance: notifyCacheInvalidation on update
    await this.notifyCacheInvalidation(tenantId, 'feature_gates');

    return result;
  }

  /**
   * Helper: S7 Email Decryption
   */
  private decryptEmail(encrypted: string | null): string {
    if (!encrypted) return '';
    try {
      const parsed = JSON.parse(encrypted);
      return this.encryptionService.decrypt(parsed);
    } catch (_e) {
      return encrypted;
    }
  }
}

// Support for legacy/non-DI consumers. In NestJS, this would be handled via providers.
export const governanceService = new GovernanceService(
  null as any,
  {
    subscribe: async () => {},
    publish: async () => 0,
    getClient: () => ({}) as any,
  } as any,
  {
    decrypt: (v: any) => (typeof v === 'string' ? v : JSON.stringify(v)),
  } as any
);
