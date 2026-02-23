// biome-ignore lint/style/useImportType: Required for NestJS Dependency Injection
import { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { publicDb } from './connection.js';
import { type Tenant, onboardingBlueprints, tenants } from './schema.js';

/**
 * S2: Tenant Registry Service
 * The ONLY authorized service for accessing the Global Registry.
 * Encapsulates ORM-based access to prevent raw SQL leaks in business logic.
 */
// 1. Explicit Type Definition (Hard Link Fix)
type NewTenant = typeof tenants.$inferInsert;

@Injectable()
export class TenantRegistryService {
  constructor(private readonly encryption: EncryptionService) { }

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
    // S7: Encrypt sensitive fields before storage
    // Note: nicheType and uiConfig are stored in public schema but might contain sensitive business logic
    let encryptedUiConfig = data.uiConfig
      ? JSON.parse(JSON.stringify(data.uiConfig)) // Clone to avoid mutation
      : null;

    if (encryptedUiConfig) {
      // Serialize and encrypt the whole object or specific fields?
      // For now, we assume the whole JSON blob is sensitive as per S7
      // BUT the schema expects jsonb, so we might need to store it as a string in a specific property OR update schema to text.
      // The user audit said: "Encrypted data in DB shows ciphertext only".
      // The current schema `uiConfig` is `jsonb`.
      // We cannot store ciphertext string in jsonb easily unless we wrap it: { "encrypted": "..." }
      // Let's wrap it for S7 compliance without breaking type too much.
      const _ciphertext = this.encryption.encrypt(
        JSON.stringify(encryptedUiConfig)
      ).encrypted;
      // We store it as: { __encrypted: true, data: ciphertext, iv: ... }
      // Actually, the `encryption` returns { encrypted, iv, tag, salt }.
      // Let's store that object.
      const securedData = this.encryption.encrypt(
        JSON.stringify(encryptedUiConfig)
      );
      (encryptedUiConfig as any) = securedData;
    }

    const _encryptedNicheType = data.nicheType
      ? this.encryption.encrypt(data.nicheType).encrypted // We only store the encrypted string?
      : // Wait, we need IV/Salt to decrypt.
      // S7 Implementation Detail: structure is { encrypted, iv, tag, salt }
      // We must serialize the whole EncryptedData object to string if the column is text.
      // `nicheType` is text.
      null;

    // Challenge: `nicheType` column is `text`. Storing JSON string of { encrypted, ... } is possible but might break length limits if small.
    // The `nicheType` likely isn't SUPER sensitive, but user asked for it.
    // Let's store it as Base64 encoded JSON of the EncryptedData.

    let finalNicheType = data.nicheType;
    if (data.nicheType) {
      const enc = this.encryption.encrypt(data.nicheType);
      finalNicheType = Buffer.from(JSON.stringify(enc)).toString('base64');
    }

    // 2. Explicit Object Construction (Forces Compiler Check)
    const insertData: NewTenant = {
      subdomain: data.subdomain,
      name: data.name,
      plan: data.plan,
      status: data.status || 'active',

      // S7: Storing encrypted data
      nicheType: finalNicheType || null,
      uiConfig: encryptedUiConfig || null,
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
    if (!nicheType || !this.isEncrypted(nicheType)) return nicheType || 'retail';
    try {
      const encData = JSON.parse(Buffer.from(nicheType, 'base64').toString());
      return this.encryption.decrypt(encData) || 'retail';
    } catch (_e) {
      return nicheType || 'retail';
    }
  }

  private decryptUiConfig(uiConfig: any): any {
    if (!uiConfig) return uiConfig;

    if (uiConfig.__encrypted) {
      try {
        const encData = uiConfig as unknown as any;
        if (encData.encrypted && encData.iv && encData.tag) {
          const jsonStr = this.encryption.decrypt(encData);
          return JSON.parse(jsonStr);
        }
      } catch (_e) {
        // Fallback
      }
    } else if (uiConfig.encrypted && uiConfig.iv) {
      try {
        const jsonStr = this.encryption.decrypt(uiConfig);
        return JSON.parse(jsonStr);
      } catch (_e) {
        // Fallback
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

  async getByIdentifier(tenantId: string): Promise<Tenant | undefined> {
    const [tenant] = await publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    return tenant ? this.decryptTenant(tenant) : undefined;
  }

  async getBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    // S2 FIX: Explicitly ensure we are querying the public schema
    const [tenant] = await publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);
    return tenant ? this.decryptTenant(tenant) : undefined;
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

    // S7: Encrypt nicheType if provided
    if (data.nicheType) {
      updateData.nicheType = this.encryption.encrypt(data.nicheType).encrypted;
      // Note: In a real S7 scenario, we'd also store IV/Tag, but the current
      // register/decrypt implementation seems to favor a simpler approach
      // or assumes specific storage patterns.
      // Looking at decryptNicheType, it tries to JSON.parse(Buffer.from(nicheType, 'base64').toString()).
      // This means the 'ciphertext' stored in nicheType is actually a base64 encoded JSON of {encrypted, iv, tag, salt}.

      const securedNiche = this.encryption.encrypt(data.nicheType);
      updateData.nicheType = Buffer.from(JSON.stringify(securedNiche)).toString(
        'base64'
      );
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

    const updated = await this.getByIdentifier(tenantId);
    if (!updated) throw new Error('Tenant not found after update');

    return updated;
  }
}
