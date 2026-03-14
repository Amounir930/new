import { AuditService } from '@apex/audit';
import { AuthService } from '@apex/auth';
import { env } from '@apex/config';
import {
  adminDb,
  and,
  eq,
  featureGatesInGovernance,
  onboardingBlueprintsInGovernance,
  sql,
  subscriptionPlansInGovernance,
  tenantQuotasInGovernance,
  tenantsInGovernance,
} from '@apex/db';
import {
  BlueprintTemplate,
  createStorageBucket,
  createTenantSchema,
  deleteStorageBucket,
  dropTenantSchema,
  getDefaultBlueprint,
  runTenantMigrations,
  seedTenantData,
} from '@apex/provisioning';
import { encrypt, hashSensitiveData } from '@apex/security';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { z } from 'zod';
import { SecurityService } from '../security/security.service';

export interface ProvisioningOptions {
  subdomain: string;
  adminEmail: string;
  storeName: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  password?: string; // New: Initial merchant password
  nicheType?: string; // S2.5: Industry classification
  uiConfig?: Record<string, unknown>; // S2.5: SDUI/Theme configuration
  blueprint?: unknown; // S3: Custom blueprint payload
  blueprintId?: string; // S21: Named blueprint ID
  superAdminKey: string; // S1/S7: Sovereign Authorization Key
}

interface ProvisioningStep {
  name: string;
  status: 'pending' | 'done' | 'failed';
}

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @Inject('AUDIT_SERVICE') private readonly audit: AuditService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => SecurityService))
    private readonly security: SecurityService
  ) {}

  /**
   * Provision a new store in under 60 seconds
   * Orchestrates S2 (Schema), S3 (Storage), and Data Seeding
   */
  async provision(options: ProvisioningOptions) {
    const startTime = Date.now();
    this.logger.log(`Starting provisioning for: ${options.subdomain}`);

    // S1 FIX: Strict NODE_ENV Validation
    if (
      !env.NODE_ENV ||
      !['development', 'test', 'production'].includes(env.NODE_ENV)
    ) {
      throw new InternalServerErrorException(
        'Invalid deployment environment (S1 Violation)'
      );
    }

    // --- SOVEREIGN AUTHORIZATION PROTOCOL (S1/S7) ---
    const expectedKey = env.SUPER_ADMIN_KEY;
    if (!expectedKey || options.superAdminKey !== expectedKey) {
      this.logger.error(
        `S1 VIOLATION: Unauthorized provisioning attempt for ${options.subdomain}`
      );
      throw new InternalServerErrorException(
        'Sovereign Authorization Required: Invalid or missing Super Admin Key'
      );
    }
    // ----------------------------------------------

    // 0. Plan Validation (Architectural Lockdown)
    const [planExists] = await adminDb
      .select({ id: subscriptionPlansInGovernance.id })
      .from(subscriptionPlansInGovernance)
      .where(
        and(
          eq(subscriptionPlansInGovernance.code, options.plan),
          eq(subscriptionPlansInGovernance.isActive, true)
        )
      )
      .limit(1);

    if (!planExists) {
      throw new BadRequestException(
        `CRITICAL: The specified subscription plan does not exist: ${options.plan}`
      );
    }

    // PROTOCOL DELTA-INJECTION: Strict Subdomain Validation
    const SubdomainSchema = z
      .string()
      .regex(/^[a-z0-9_-]+$/)
      .min(3)
      .max(50);
    try {
      SubdomainSchema.parse(options.subdomain);
    } catch (_e) {
      throw new ConflictException(
        `Invalid subdomain format: ${options.subdomain}`
      );
    }

    // Track steps for rollback if needed
    const steps: ProvisioningStep[] = [
      { name: 'schema_creation', status: 'pending' },
      { name: 'migrations', status: 'pending' },
      { name: 'bucket_creation', status: 'pending' },
      { name: 'seeding', status: 'pending' },
      { name: 'governance_sync', status: 'pending' },
    ];

    try {
      // 0. Blueprint Resolution Logic (S21 Priority)
      const effectiveBlueprint = await this.resolveBlueprint(options);

      // 1. S2 Protocol: Create Isolated Database Schema
      await createTenantSchema(options.subdomain);
      steps[0].status = 'done';

      // 2. Schema Construction: Run Migrations
      await runTenantMigrations(options.subdomain);
      steps[1].status = 'done';

      // 3. S7 Protocol: Register Central Merchant Identity (Idempotent)
      const adminId = await this.authService.registerMerchant(
        options.adminEmail,
        options.password || `Init_${crypto.randomUUID().slice(0, 12)}!_S7` // Secure dynamic fallback
      );

      // 4. S3 Protocol: Create Isolated Storage Bucket
      await createStorageBucket(options.subdomain, options.plan);
      steps[2].status = 'done';

      const seedResult = await seedTenantData({
        subdomain: options.subdomain,
        adminEmail: options.adminEmail,
        adminId: adminId,
        storeName: options.storeName,
        plan: options.plan,
        password: options.password, // S7: Secure merchant password
        nicheType: options.nicheType, // S2.5: Priority niche
        uiConfig: options.uiConfig, // S2.5: Priority UI Config
        blueprint: effectiveBlueprint, // S3: Pass custom blueprint
      });
      steps[3].status = 'done';

      // S2 FIX 1D: Removed SET search_path on shared pool (was contaminating connections)
      // registerTenant and syncGovernance use schema-qualified queries via publicDb

      // 5. Register in Public Schema (HANDLED by seedTenantData -> resolveStore)
      // await this.registerTenant(options, seedResult.adminId);

      // 6. S21 FIX: Sync Governance (Link Blueprint to Enforcement)
      await this.syncGovernance(options.subdomain, effectiveBlueprint);
      steps[4].status = 'done';

      const durationMs = Date.now() - startTime;
      // 6. S4 Protocol: Audit Log the creation
      await this.audit.log({
        action: 'STORE_PROVISIONED',
        entityType: 'STORE',
        entityId: options.subdomain,
        metadata: {
          durationMs,
          plan: options.plan,
          adminEmail: options.adminEmail,
        },
      });

      this.logger.log(
        `Provisioning complete for ${options.subdomain} in ${durationMs}ms`
      );

      return {
        success: true,
        subdomain: options.subdomain,
        durationMs,
        adminId: seedResult.adminId,
      };
    } catch (error) {
      this.logger.error(`PROVISIONING FAILED for ${options.subdomain}`, error);

      // S4: Log Failure in Audit Registry
      await this.audit.log({
        action: 'STORE_PROVISIONING_FAILED',
        entityType: 'STORE',
        entityId: options.subdomain,
        metadata: {
          // S4 FIX: Sanitize error message to prevent leakage of internal details
          error: 'Provisioning failed. Check internal logs for details.',
          failed_steps: steps
            .filter((s) => s.status === 'failed')
            .map((s) => s.name),
          plan: options.plan,
        },
      });

      // Trigger Rollback Logic
      await this.rollback(options.subdomain, steps);

      if (error instanceof Error && error.message.includes('exists')) {
        throw new ConflictException(error.message);
      }

      throw new InternalServerErrorException(
        `Provisioning Failed: ${
          error instanceof Error ? error.message : 'Unknown'
        }`
      );
    }
  }

  /**
   * Resolve the active blueprint based on the current provision request (S21 Phase 6)
   */
  private async resolveBlueprint(
    options: ProvisioningOptions
  ): Promise<BlueprintTemplate> {
    if (options.blueprintId) {
      this.logger.log(
        `Fetching specific blueprint by ID: ${options.blueprintId}`
      );
      const [dbBlueprint] = await adminDb
        .select({
          blueprint: onboardingBlueprintsInGovernance.blueprint,
          status: onboardingBlueprintsInGovernance.status,
        })
        .from(onboardingBlueprintsInGovernance)
        .where(eq(onboardingBlueprintsInGovernance.id, options.blueprintId))
        .limit(1);

      if (!dbBlueprint) {
        throw new ConflictException(
          `Blueprint with ID ${options.blueprintId} not found.`
        );
      }

      if (dbBlueprint.status === 'paused') {
        throw new ConflictException(
          'Selected blueprint is currently PAUSED and cannot be used for provisioning.'
        );
      }

      return dbBlueprint.blueprint as BlueprintTemplate;
    }

    this.logger.log(
      `Resolving default blueprint for niche: ${options.nicheType || 'retail'}, plan: ${options.plan}`
    );
    const [dbBlueprint] = await adminDb
      .select({
        blueprint: onboardingBlueprintsInGovernance.blueprint,
        status: onboardingBlueprintsInGovernance.status,
      })
      .from(onboardingBlueprintsInGovernance)
      .where(
        and(
          eq(
            onboardingBlueprintsInGovernance.nicheType,
            (options.nicheType || 'retail') as any
          ),
          eq(onboardingBlueprintsInGovernance.plan, options.plan)
        )
      )
      .limit(1);

    if (dbBlueprint && dbBlueprint.status === 'paused') {
      throw new ConflictException(
        `Blueprint for ${options.nicheType || 'retail'}/${options.plan} is currently PAUSED and cannot be used for provisioning.`
      );
    }

    if (!dbBlueprint) {
      throw new ConflictException(
        `CRITICAL: No active blueprint found for plan '${options.plan}' and niche '${options.nicheType || 'retail'}'. Provisioning aborted to prevent architectural drift.`
      );
    }

    return dbBlueprint.blueprint as BlueprintTemplate;
  }

  /**
   * Register tenant in the Global Tenant Registry
   */
  private async registerTenant(options: ProvisioningOptions, _adminId: string) {
    try {
      // Idempotency Check: Don't fail if already registered (e.g. retry)
      const [exists] = await adminDb
        .select({ id: tenantsInGovernance.id })
        .from(tenantsInGovernance)
        .where(eq(tenantsInGovernance.subdomain, options.subdomain))
        .limit(1);

      if (exists) {
        this.logger.log(
          `Tenant ${options.subdomain} already registered. Skipping registry insert.`
        );
        return;
      }

      await adminDb.insert(tenantsInGovernance).values({
        subdomain: options.subdomain,
        name: options.storeName,
        plan: options.plan,
        status: 'active',
        ownerEmail: encrypt(options.adminEmail), // Protocol S7: Store encrypted PII
        ownerEmailHash: hashSensitiveData(options.adminEmail), // Protocol S7: Store searchable hash
        nicheType: options.nicheType, // S2.5: Persist niche
        uiConfig: options.uiConfig, // S2.5: Persist SDUI settings
      });
    } catch (error) {
      this.logger.error(
        `S2 FAILURE: Failed to register tenant ${options.subdomain} in registry`,
        error
      );
      throw error;
    }
  }

  /**
   * Rollback partially created resources on failure
   * S11 Mandate: Unbreakable sequence ensuring zero "Zombie Tenants"
   */
  private async rollback(subdomain: string, steps: ProvisioningStep[]) {
    this.logger.warn(`ROLLING BACK provisioning for ${subdomain}`);

    // 1. S2 Protocol: Drop Schema
    if (
      steps.find((s) => s.name === 'schema_creation' && s.status === 'done')
    ) {
      try {
        await dropTenantSchema(subdomain);
        this.logger.log(`Rollback: Dropped schema for ${subdomain}`);
      } catch (e) {
        // Protocol S5: Log and continue - we must not let one failure block the registry purge
        this.logger.error(`Rollback FAILED to drop schema for ${subdomain}`, e);
      }
    }

    // 2. S3 Protocol: Delete MinIO Bucket
    if (
      steps.find((s) => s.name === 'bucket_creation' && s.status === 'done')
    ) {
      try {
        const { deleteStorageBucket } = await import('@apex/provisioning');
        await deleteStorageBucket(subdomain, true);
        this.logger.log(`Rollback: Deleted storage bucket for ${subdomain}`);
      } catch (e) {
        this.logger.error(
          `Rollback FAILED to delete bucket for ${subdomain}`,
          e
        );
      }
    }

    // 3. S7 Protocol: Unregister from Central Registry (Physical Extermination)
    try {
      await adminDb
        .delete(tenantsInGovernance)
        .where(eq(tenantsInGovernance.subdomain, subdomain));
      this.logger.log(`Rollback: Purged registry entry for ${subdomain}`);
    } catch (e) {
      this.logger.error(
        `Rollback FAILED to purge registry for ${subdomain}`,
        e
      );
    }
  }

  /**
   * Sync Blueprint JSON modules and quotas to the central Governance system
   * This ensures that "Frontend" settings in the Blueprint become "Backend" enforcements.
   */
  private async syncGovernance(
    subdomain: string,
    blueprint: BlueprintTemplate
  ) {
    if (!blueprint || typeof blueprint !== 'object') return;

    // Resolve Tenant ID
    const [tenant] = await adminDb
      .select({ id: tenantsInGovernance.id })
      .from(tenantsInGovernance)
      .where(eq(tenantsInGovernance.subdomain, subdomain))
      .limit(1);

    if (!tenant) {
      this.logger.warn(
        `Governance Sync skipped: Tenant ${subdomain} not found in registry yet.`
      );
      return;
    }

    // 1. Sync Feature Gates (Modules)
    if (blueprint.modules) {
      const gates = Object.entries(blueprint.modules).map(([key, enabled]) => ({
        tenantId: tenant.id,
        featureKey: key,
        isEnabled: !!enabled,
      }));

      if (gates.length > 0) {
        await adminDb
          .insert(featureGatesInGovernance)
          .values(gates)
          .onConflictDoUpdate({
            target: [
              featureGatesInGovernance.tenantId,
              featureGatesInGovernance.featureKey,
            ],
            set: { isEnabled: sql`EXCLUDED.is_enabled` },
          });
      }
    }

    // 2. Sync Quotas (S3: Normalize & Validate via Zod)
    if (blueprint.quotas) {
      const { z } = await import('zod');
      const QuotaSchema = z
        .object({
          max_products: z.number().int().min(0).default(0),
          max_orders: z.number().int().min(0).default(0),
          max_staff: z.number().int().min(0).default(0),
          max_pages: z.number().int().min(0).default(0),
          max_categories: z.number().int().min(0).default(0),
          max_coupons: z.number().int().min(0).default(0),
          storage_limit_gb: z.number().int().min(1).default(1),
          api_rate_limit: z.number().int().min(0).default(100),
        })
        .strip();

      const normalizedQuotas = QuotaSchema.parse(blueprint.quotas);

      // S21 FIX: Use Manual Sync to bypass DB Lock/Indexing walls
      const [existingQuota] = await adminDb
        .select({ id: tenantQuotasInGovernance.id })
        .from(tenantQuotasInGovernance)
        .where(eq(tenantQuotasInGovernance.tenantId, tenant.id))
        .limit(1);

      if (existingQuota) {
        await adminDb
          .update(tenantQuotasInGovernance)
          .set({
            maxProducts: normalizedQuotas.max_products,
            maxOrders: normalizedQuotas.max_orders,
            maxStaff: normalizedQuotas.max_staff,
            maxPages: normalizedQuotas.max_pages,
            maxCategories: normalizedQuotas.max_categories,
            maxCoupons: normalizedQuotas.max_coupons,
            storageLimitGb: normalizedQuotas.storage_limit_gb,
            apiRateLimit: normalizedQuotas.api_rate_limit,
            updatedAt: sql`now()`,
          })
          .where(eq(tenantQuotasInGovernance.id, existingQuota.id));
      } else {
        await adminDb.insert(tenantQuotasInGovernance).values({
          tenantId: tenant.id,
          maxProducts: normalizedQuotas.max_products,
          maxOrders: normalizedQuotas.max_orders,
          maxStaff: normalizedQuotas.max_staff,
          maxPages: normalizedQuotas.max_pages,
          maxCategories: normalizedQuotas.max_categories,
          maxCoupons: normalizedQuotas.max_coupons,
          storageLimitGb: normalizedQuotas.storage_limit_gb,
          apiRateLimit: normalizedQuotas.api_rate_limit,
        });
      }
    }

    this.logger.log(`Governance sync completed for tenant: ${subdomain}`);
  }

  /**
   * Deep Purge Protocol (Physical Deletion)
   * Orchestrates the destruction of all isolated assets
   */
  async deprovisionTenant(subdomain: string) {
    const cleanSubdomain = subdomain.toLowerCase();
    this.logger.warn(`[DEPROVISION] Starting Deep Purge for ${cleanSubdomain}`);

    try {
      // Step 1: Physical Lockout (Redis)
      await this.security.setTenantLock(cleanSubdomain, true);
      this.logger.log(`[DEPROVISION] Steel Control Lock engaged for ${cleanSubdomain}`);

      // Step 2: Storage Destruction (MinIO)
      // Force purge enabled to handle non-empty buckets/versions
      await deleteStorageBucket(cleanSubdomain, true);
      this.logger.log(`[DEPROVISION] Storage bucket destroyed for ${cleanSubdomain}`);

      // Step 3: Schema Destruction (SQL)
      await dropTenantSchema(cleanSubdomain);
      this.logger.log(`[DEPROVISION] PostgreSQL schema dropped for ${cleanSubdomain}`);

      this.logger.log(`[DEPROVISION] Physical Assets EXTERMINATED for ${cleanSubdomain}`);
    } catch (error) {
      this.logger.error(
        `[DEPROVISION_FAILURE] Failed to purge physical assets for ${cleanSubdomain}`,
        error
      );
      // S11 Mandate: Physical failures MUST halt the logical deletion to prevent orphaned data.
      throw new InternalServerErrorException(
        `Deep Purge Failed: Physical extermination aborted for ${cleanSubdomain}. Check logs.`
      );
    }
  }
}
