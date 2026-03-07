import type { AuditService } from '@apex/audit';
import { env } from '@apex/config';
import {
  adminDb,
  and,
  eq,
  featureGatesInGovernance,
  onboardingBlueprintsInGovernance,
  tenantQuotasInGovernance,
  tenantsInGovernance,
} from '@apex/db';
import {
  type BlueprintTemplate,
  createStorageBucket,
  createTenantSchema,
  dropTenantSchema,
  getDefaultBlueprint,
  runTenantMigrations,
  seedTenantData,
} from '@apex/provisioning';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

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
}

interface ProvisioningStep {
  name: string;
  status: 'pending' | 'done' | 'failed';
}

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(@Inject('AUDIT_SERVICE') private readonly audit: AuditService) {}

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

      // 3. S3 Protocol: Create Isolated Storage Bucket
      await createStorageBucket(options.subdomain);
      steps[2].status = 'done';

      const seedResult = await seedTenantData({
        subdomain: options.subdomain,
        adminEmail: options.adminEmail,
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

      // 5. Register in Public Schema (CRITICAL: Must happen before syncGovernance)
      await this.registerTenant(options, seedResult.adminId);

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

    if (options.blueprint) {
      return options.blueprint as BlueprintTemplate;
    }

    this.logger.log(
      `Resolving default blueprint for niche: ${options.nicheType}, plan: ${options.plan}`
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
            (options.nicheType || 'retail') as
              | 'retail'
              | 'wellness'
              | 'education'
              | 'services'
              | 'hospitality'
              | 'real-estate'
              | 'creative'
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

    return (
      (dbBlueprint?.blueprint as BlueprintTemplate) ||
      (await getDefaultBlueprint(options.plan))
    );
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
   */
  private async rollback(subdomain: string, steps: ProvisioningStep[]) {
    this.logger.warn(`ROLLING BACK provisioning for ${subdomain}`);

    // Reverse order cleanup
    if (
      steps.find((s) => s.name === 'schema_creation' && s.status === 'done')
    ) {
      try {
        await dropTenantSchema(subdomain);
        this.logger.log(`Rollback: Dropped schema for ${subdomain}`);
      } catch (e) {
        this.logger.error(`Rollback FAILED to drop schema for ${subdomain}`, e);
      }
    }

    // In a real implementation, we would also:
    // 1. Delete the MinIO bucket
    if (
      steps.find((s) => s.name === 'bucket_creation' && s.status === 'done')
    ) {
      try {
        await import('@apex/provisioning').then((m) =>
          m.deleteStorageBucket(subdomain, true)
        );
        this.logger.log(`Rollback: Deleted storage bucket for ${subdomain}`);
      } catch (e) {
        this.logger.error(
          `Rollback FAILED to delete bucket for ${subdomain}`,
          e
        );
      }
    }
    // 2. Log the failure in audit
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
          .onConflictDoNothing();
      }
    }

    // 2. Sync Quotas (S3: Normalize & Validate via Zod)
    if (blueprint.quotas) {
      const { z } = await import('zod');
      const QuotaSchema = z
        .object({
          max_products: z.number().int().min(0).max(1000000).default(0),
          max_orders: z.number().int().min(0).max(1000000).default(0),
          max_staff: z.number().int().min(0).max(1000).default(0),
        })
        .strip();

      const normalizedQuotas = QuotaSchema.parse(blueprint.quotas);

      await adminDb
        .insert(tenantQuotasInGovernance)
        .values({
          tenantId: tenant.id,
          maxProducts: normalizedQuotas.max_products,
          maxOrders: normalizedQuotas.max_orders,
          maxStaff: normalizedQuotas.max_staff,
        })
        .onConflictDoNothing();
    }

    this.logger.log(`Governance sync completed for tenant: ${subdomain}`);
  }
}
