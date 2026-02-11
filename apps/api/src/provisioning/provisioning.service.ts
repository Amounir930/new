/**
 * Provisioning Service
 * Orchestrates the 60-second store creation process
 */

import { AuditService } from '@apex/audit';
import { TenantRegistryService } from '@apex/db';
import {
  createStorageBucket,
  createTenantSchema,
  dropTenantSchema,
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
}

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @Inject('AUDIT_SERVICE') private readonly audit: AuditService,
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
    const steps: { name: string; status: 'pending' | 'done' | 'failed' }[] = [
      { name: 'schema_creation', status: 'pending' },
      { name: 'migrations', status: 'pending' },
      { name: 'bucket_creation', status: 'pending' },
      { name: 'seeding', status: 'pending' },
    ];

    try {
      // 1. S2 Protocol: Create Isolated Database Schema
      await createTenantSchema(options.subdomain);
      steps[0].status = 'done';

      // 2. Schema Construction: Run Migrations
      await runTenantMigrations(options.subdomain);
      steps[1].status = 'done';

      // 3. S3 Protocol: Create Isolated Storage Bucket
      await createStorageBucket(options.subdomain);
      steps[2].status = 'done';

      // 4. Data Seeding: Create Admin User & Default Settings
      const seedResult = await seedTenantData({
        subdomain: options.subdomain,
        adminEmail: options.adminEmail,
        storeName: options.storeName,
      });
      steps[3].status = 'done';

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
      await this.tenantRegistry.register({
        subdomain: options.subdomain,
        name: options.storeName,
        plan: options.plan,
        status: 'active',
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
  private async rollback(subdomain: string, steps: any[]) {
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
    // 2. Log the failure in audit
  }
}
