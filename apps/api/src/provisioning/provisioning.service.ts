/**
 * Provisioning Service
 * Orchestrates the 60-second store creation process
 */

// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { AuditService } from '@apex/audit';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import {
  featureGates,
  onboardingBlueprints,
  publicDb,
  TenantRegistryService,
  tenantQuotas,
  tenants,
} from '@apex/db';
import {
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
import { and, eq, sql } from 'drizzle-orm';

export interface ProvisioningOptions {
  subdomain: string;
  adminEmail: string;
  storeName: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  nicheType?: string; // S2.5: Industry classification
  uiConfig?: Record<string, unknown>; // S2.5: SDUI/Theme configuration
  blueprint?: unknown; // S3: Custom blueprint payload
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
    @Inject('TENANT_REGISTRY')
    private readonly tenantRegistry: TenantRegistryService
  ) {}

  /**
   * Provision a new store in under 60 seconds
   * Orchestrates S2 (Schema), S3 (Storage), and Data Seeding
   */
  async provision(options: ProvisioningOptions) {
    const startTime = Date.now();
    this.logger.log(`Starting provisioning for: ${options.subdomain}`);

    // Track steps for rollback if needed
    const steps: ProvisioningStep[] = [
      { name: 'schema_creation', status: 'pending' },
      { name: 'migrations', status: 'pending' },
      { name: 'bucket_creation', status: 'pending' },
      { name: 'seeding', status: 'pending' },
      { name: 'governance_sync', status: 'pending' },
    ];

    try {
      // 0. S21: Resolve Blueprint if not provided
      let effectiveBlueprint = options.blueprint;
      if (!effectiveBlueprint) {
        this.logger.log(
          `Resolving blueprint for niche: ${options.nicheType}, plan: ${options.plan}`
        );
        const [dbBlueprint] = await publicDb
          .select({
            blueprint: onboardingBlueprints.blueprint,
            status: onboardingBlueprints.status,
          })
          .from(onboardingBlueprints)
          .where(
            and(
              eq(onboardingBlueprints.nicheType, options.nicheType || 'retail'),
              eq(onboardingBlueprints.plan, options.plan)
            )
          )
          .limit(1);

        if (dbBlueprint && dbBlueprint.status === 'paused') {
          throw new ConflictException(
            `Blueprint for ${options.nicheType || 'retail'}/${options.plan} is currently PAUSED and cannot be used for provisioning.`
          );
        }

        effectiveBlueprint =
          dbBlueprint?.blueprint || (await getDefaultBlueprint(options.plan));
      }
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
        nicheType: options.nicheType, // S2.5: Priority niche
        uiConfig: options.uiConfig, // S2.5: Priority UI Config
        blueprint: effectiveBlueprint, // S3: Pass custom blueprint
      });
      steps[3].status = 'done';

      // 4.1 S21 FIX: Sync Governance (Link Blueprint to Enforcement)
      await this.syncGovernance(options.subdomain, effectiveBlueprint);
      steps[4].status = 'done';

      // 4.5 Reset search_path to public to ensure registerTenant can see the registry
      await publicDb.execute(sql`SET search_path TO public`);

      const durationMs = Date.now() - startTime;

      // 5. Register in Public Schema (Cross-tenant registration)
      // This is the only place we write to public after provisioning starts
      await this.registerTenant(options, seedResult.adminId);

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
          error: error instanceof Error ? error.message : 'Unknown',
          steps,
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
   * Register tenant in the Global Tenant Registry
   */
  private async registerTenant(options: ProvisioningOptions, _adminId: string) {
    try {
      // Idempotency Check: Don't fail if already registered (e.g. retry)
      const exists = await this.tenantRegistry.existsBySubdomain(
        options.subdomain
      );
      if (exists) {
        this.logger.log(
          `Tenant ${options.subdomain} already registered. Skipping registry insert.`
        );
        return;
      }

      await this.tenantRegistry.register({
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
  private async syncGovernance(subdomain: string, blueprint: any) {
    if (!blueprint || typeof blueprint !== 'object') return;

    // Resolve Tenant ID
    const [tenant] = await publicDb
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
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
        await publicDb.insert(featureGates).values(gates).onConflictDoNothing();
      }
    }

    // 2. Sync Quotas
    if (blueprint.quotas) {
      await publicDb
        .insert(tenantQuotas)
        .values({
          tenantId: tenant.id,
          maxProducts: blueprint.quotas.max_products || 0,
          maxOrders: blueprint.quotas.max_orders || 0,
          maxPages: blueprint.quotas.max_pages || 0,
        })
        .onConflictDoNothing();
    }

    this.logger.log(`Governance sync completed for tenant: ${subdomain}`);
  }
}
