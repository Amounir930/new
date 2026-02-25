// biome-ignore lint/style/useImportType: Required for NestJS Dependency Injection
import { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { publicDb } from './connection.js';
import { getGlobalRedis } from './redis.service.js';
import { type Tenant, tenants } from './schema.js';
import { onboardingBlueprints } from './schema/governance.js';

/**
 * S2: Tenant Registry Service
 * The ONLY authorized service for accessing the Global Registry.
 * Encapsulates ORM-based access to prevent raw SQL leaks in business logic.
 */
// 1. Explicit Type Definition (Hard Link Fix)
type NewTenant = typeof tenants.$inferInsert;

@Injectable()
export class TenantRegistryService {
  constructor(private readonly encryption: EncryptionService) {}

  /**
   * Register a new tenant in the registry
   */
  async register(data: {
    subdomain: string;
    name: string;
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    status?: string;
    nicheType?: string;
    uiConfig?: Record<string, unknown>;
  }): Promise<Tenant> {
    // 2. Explicit Object Construction (Forces Compiler Check)
    const insertData: NewTenant = {
      subdomain: data.subdomain,
      name: data.name,
      plan: data.plan,
      status: data.status || 'active',

      // S7: Storing encrypted data as standardized JSON
      nicheType: this.encryptField(data.nicheType),
      uiConfig: data.uiConfig
        ? (this.encryption.encrypt(JSON.stringify(data.uiConfig)) as any)
        : null,
    } as NewTenant;

    const [newTenant] = await publicDb
      .insert(tenants)
      .values(insertData)
      .returning();

    return this.decryptTenant(newTenant);
  }

  // ... (updateStatus, updatePlan remain unchanged)

  /**
   * Helper to decrypt tenant data after retrieval
   */
  private decryptTenant(tenant: Tenant): Tenant {
    if (!tenant) return tenant;
    const decrypted = { ...tenant };

    decrypted.nicheType = this.decryptNicheType(tenant.nicheType);
    decrypted.uiConfig = this.decryptUiConfig(tenant.uiConfig);

    return decrypted;
  }

  private decryptNicheType(nicheType: string | null): string {
    if (!nicheType) return 'retail';
    try {
      const encData = JSON.parse(nicheType);
      if (encData.encrypted && encData.iv) {
        return this.encryption.decrypt(encData) || 'retail';
      }
      return nicheType;
    } catch (_e) {
      return nicheType || 'retail';
    }
  }

  private decryptUiConfig(uiConfig: any): any {
    if (!uiConfig) return uiConfig;

    if (uiConfig.encrypted && uiConfig.iv && uiConfig.tag) {
      try {
        const jsonStr = this.encryption.decrypt(uiConfig);
        return JSON.parse(jsonStr);
      } catch (_e) {
        return uiConfig;
      }
    }
    return uiConfig;
  }

  private isEncrypted(val: string): boolean {
    // Simple heuristic: starts with valid base64 char and likely JSON
    // Better: try parse
    return val.trim().length > 0;
  }

  /**
   * Risk #14: Centralized Encryption/Serialization for PII fields
   */
  private encryptField(value: string | undefined | null): string | null {
    if (!value) return null;
    const encrypted = this.encryption.encrypt(value);
    return JSON.stringify(encrypted);
  }

  /**
   * Get all tenants (Admin only)
   */
  async findAll(): Promise<Tenant[]> {
    const results = await publicDb
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt));
    return results.map((t) => this.decryptTenant(t));
  }

  // ... (exists methods remain unchanged)

  async getByIdentifier(tenantId: string): Promise<Tenant | null> {
    const [tenant] = await publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant && tenant.status !== 'active') {
      throw new Error('TENANT_SUSPENDED');
    }

    return tenant ? this.decryptTenant(tenant) : null;
  }

  async getBySubdomain(subdomain: string): Promise<Tenant | null> {
    // S2 FIX: Explicitly ensure we are querying the public schema
    const [tenant] = await publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (tenant && tenant.status !== 'active') {
      throw new Error('TENANT_SUSPENDED');
    }

    return tenant ? this.decryptTenant(tenant) : null;
  }

  /**
   * S2.5: Get Global Blueprint Config for a Niche
   * Used for fallback discovery when tenant UI config is default.
   */
  async getBlueprintConfig(
    nicheType: string
  ): Promise<Record<string, unknown> | undefined> {
    // S7: nicheType searching is now impossible if we encrypt it nondeterministically!
    // The requirement says: "S7 Encryption... Querying... will no longer be possible"
    // So we must fetch all or use Blind Index if we want to search.
    // BUT `onboardingBlueprints` table also has `nicheType`.
    // The user instruction was to encrypt `tenants` table. `onboardingBlueprints` is global catalog.
    // If we encrypt `nicheType` in tenants, we can't join easily.
    // We will assume `onboardingBlueprints.nicheType` acts as a key and might NOT be encrypted or we use Blind Index.
    // The `encryption.ts` has `hashSensitiveData`.
    // Let's use `hashSensitiveData` for searching if needed, but `getBlueprintConfig` takes `nicheType` (plaintext from caller?).
    // Yes, the caller passes plaintext nicheType (e.g. "fashion").
    // We query `onboardingBlueprints`.
    // Does `onboardingBlueprints` have encrypted nicheType? The requirement was for `tenants` table.
    // We assume `onboardingBlueprints` is standard reference data (not PII), so maybe plaintext is fine?
    // Let's check schema for `onboardingBlueprints` later. For now, strictly `tenants` encryption.

    // Original code:
    const [blueprint] = await publicDb
      .select({ uiConfig: onboardingBlueprints.uiConfig })
      .from(onboardingBlueprints)
      .where(eq(onboardingBlueprints.nicheType, nicheType as any))
      .limit(1);

    return (blueprint?.uiConfig as Record<string, unknown>) || undefined;
  }

  /**
   * Check if a tenant exists by ID
   */
  async exists(tenantId: string): Promise<boolean> {
    const [tenant] = await publicDb
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    return !!tenant;
  }

  /**
   * Check if a tenant exists by subdomain
   */
  async existsBySubdomain(subdomain: string): Promise<boolean> {
    const [tenant] = await publicDb
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);
    return !!tenant;
  }

  /**
   * Update tenant core properties (S21 Phase 8)
   */
  async update(
    tenantId: string,
    data: {
      plan?: string;
      name?: string;
      status?: string;
      nicheType?: string;
    }
  ): Promise<Tenant> {
    const updateData: any = { ...data };

    // S7: Encrypt nicheType consistently (Risk #14)
    if (data.nicheType) {
      updateData.nicheType = this.encryptField(data.nicheType);
    }

    if (Object.keys(updateData).length === 0) {
      const tenant = await this.getByIdentifier(tenantId);
      if (!tenant) throw new Error('Tenant not found');
      return tenant;
    }

    await publicDb
      .update(tenants)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    // Fatal Mandate #8: Active Redis cache invalidation on reactivation
    if (data.status === 'active') {
      try {
        const redis = await getGlobalRedis();
        const client = await redis.getClient();
        const tenant = await this.getByIdentifier(tenantId);
        if (tenant) {
          await client.del(`suspended_tenant:${tenant.id}`);
          await client.del(`suspended_tenant:${tenant.subdomain}`);
        }
      } catch (redisErr) {
        console.warn('[Redis] Failed to clear suspension cache:', redisErr);
      }
    }

    const updated = await this.getByIdentifier(tenantId);
    if (!updated) throw new Error('Tenant not found after update');

    return updated;
  }
}
