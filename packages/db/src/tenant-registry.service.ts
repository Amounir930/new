import { Injectable } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { publicDb } from './connection.js';
import { type Tenant, tenants } from './schema.js';

/**
 * S2: Tenant Registry Service
 * The ONLY authorized service for accessing the Global Registry.
 * Encapsulates ORM-based access to prevent raw SQL leaks in business logic.
 */
@Injectable()
export class TenantRegistryService {
  /**
   * Check if a tenant exists by id or subdomain
   */
  async exists(identifier: string): Promise<boolean> {
    const result = await publicDb
      .select({ count: tenants.id })
      .from(tenants)
      .where(
        or(eq(tenants.id, identifier as any), eq(tenants.subdomain, identifier))
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get tenant metadata by subdomain
   */
  async getBySubdomain(subdomain: string): Promise<Tenant | null> {
    const result = await publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get tenant metadata by ID or subdomain
   */
  async getByIdentifier(identifier: string): Promise<Tenant | null> {
    const result = await publicDb
      .select()
      .from(tenants)
      .where(
        or(eq(tenants.id, identifier as any), eq(tenants.subdomain, identifier))
      )
      .limit(1);

    return result[0] || null;
  }

  /**
   * Register a new tenant in the registry
   */
  async register(data: {
    subdomain: string;
    name: string;
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    status?: string;
  }): Promise<Tenant> {
    const [newTenant] = await publicDb
      .insert(tenants)
      .values({
        subdomain: data.subdomain,
        name: data.name,
        plan: data.plan,
        status: data.status || 'active',
      })
      .returning();

    return newTenant;
  }

  /**
   * Update tenant status (active, suspended, etc.)
   */
  async updateStatus(
    tenantId: string,
    status: 'active' | 'suspended' | 'pending'
  ): Promise<void> {
    await publicDb
      .update(tenants)
      .set({ status, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId as any));
  }

  /**
   * Update tenant subscription plan
   */
  async updatePlan(
    tenantId: string,
    plan: 'free' | 'basic' | 'pro' | 'enterprise'
  ): Promise<void> {
    await publicDb
      .update(tenants)
      .set({ plan, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId as any));
  }
}
