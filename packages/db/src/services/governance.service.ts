/**
 * Governance Service (Rule 2: S2 Compliance)
 *
 * Centralized logic for enforcing tenant quotas and feature gates.
 *
 * @module @apex/db/services/governance.service
 */

import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '../connection';
import { getTenantTableName, tenants } from '../schema';
import {
  featureGates,
  subscriptionPlans,
  tenantQuotas,
} from '../schema/governance';

export class GovernanceService {
  /**
   * Get effective limits for a tenant (Plan base + overrides)
   */
  async getTenantLimits(tenantId: string) {
    // 1. Get tenant and their plan
    const tenant = await db
      .select({
        id: tenants.id,
        planCode: tenants.plan,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .then((res) => res[0]);

    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    // 2. Get plan base limits
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.code, tenant.planCode))
      .then((res) => res[0]);

    // 3. Get tenant-specific overrides
    const quotaOverride = await db
      .select()
      .from(tenantQuotas)
      .where(eq(tenantQuotas.tenantId, tenantId))
      .then((res) => res[0]);

    return {
      maxProducts: quotaOverride?.maxProducts ?? plan?.defaultMaxProducts ?? 50,
      maxOrders: quotaOverride?.maxOrders ?? plan?.defaultMaxOrders ?? 100,
      maxPages: quotaOverride?.maxPages ?? plan?.defaultMaxPages ?? 5,
      storageLimitGb: quotaOverride?.storageLimitGb ?? 1,
    };
  }

  /**
   * Check if a tenant has reached their quota for a resource
   */
  async checkQuota(
    tenantId: string,
    resourceType: 'products' | 'orders' | 'pages',
    subdomain: string
  ): Promise<{ allowed: boolean; limit: number; current: number }> {
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
    };
  }

  /**
   * Internal helper to count resources within a tenant schema
   */
  private async getResourceCount(
    subdomain: string,
    resourceType: 'products' | 'orders' | 'pages'
  ): Promise<number> {
    const tableName = resourceType === 'pages' ? 'pages' : resourceType; // products, orders
    const qualifiedTable = getTenantTableName(tableName, subdomain);

    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM ${sql.raw(qualifiedTable)}`
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
    // 1. Get tenant plan
    const tenant = await db
      .select({ plan: tenants.plan })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .then((res) => res[0]);

    if (!tenant) return false;

    // 2. Check if there's a specific gate for this tenant OR their plan
    const gates = await db
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

    // If multiple gates found (one for plan, one for tenant), tenant override wins.
    const tenantGate = gates.find((g) => g.tenantId === tenantId);
    if (tenantGate) return !!tenantGate.isEnabled;

    const planGate = gates.find((g) => g.planCode === tenant.plan);
    if (planGate) return !!planGate.isEnabled;

    // Default: Feature is disabled unless explicitly enabled for plan or tenant
    return false;
  }
}

export const governanceService = new GovernanceService();
