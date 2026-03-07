// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { AuditService } from '@apex/audit';
import { adminDb, eq, onboardingBlueprintsInGovernance } from '@apex/db';
import type { BlueprintRecord, BlueprintTemplate } from '@apex/provisioning';
import { createSnapshot, validateBlueprint } from '@apex/provisioning';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  CreateBlueprintDto,
  UpdateBlueprintDto,
} from './dto/blueprint.dto';
import { blueprintStructureSchema } from './dto/blueprint.dto';

@Injectable()
export class BlueprintsService {
  private readonly logger = new Logger(BlueprintsService.name);
  private db = adminDb;

  constructor(private readonly audit: AuditService) {}

  async findAll(): Promise<BlueprintRecord[]> {
    const results = await this.db
      .select()
      .from(onboardingBlueprintsInGovernance);
    return results.map((r) => this.mapBlueprintRecord(r));
  }

  async findOne(id: string): Promise<BlueprintRecord> {
    const results = await this.db
      .select()
      .from(onboardingBlueprintsInGovernance)
      .where(eq(onboardingBlueprintsInGovernance.id, id));
    const blueprint = results[0];

    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }
    return this.mapBlueprintRecord(blueprint);
  }

  async create(
    userId: string,
    dto: CreateBlueprintDto
  ): Promise<BlueprintRecord> {
    const blueprintData = dto.blueprint as BlueprintTemplate;

    try {
      validateBlueprint(blueprintData);
    } catch (e) {
      throw new Error(
        `Invalid blueprint structure: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    }

    const [newBlueprint] = await this.db
      .insert(onboardingBlueprintsInGovernance)
      .values({
        name: dto.name,
        description: dto.description || null,
        plan: dto.plan,
        nicheType: (dto.nicheType || 'retail') as
          | 'retail'
          | 'wellness'
          | 'education'
          | 'services'
          | 'hospitality'
          | 'real-estate'
          | 'creative',
        status: (dto.status || 'active') as 'active' | 'paused',
        uiConfig: dto.uiConfig || {},
        isDefault: dto.isDefault,
        blueprint: blueprintData,
      })
      .returning();

    this.audit.log({
      userId,
      tenantId: 'system',
      action: 'BLUEPRINT_CREATED',
      entityType: 'onboarding_blueprints',
      entityId: newBlueprint.id,
      metadata: { name: dto.name, plan: dto.plan },
    });

    return this.mapBlueprintRecord(newBlueprint);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBlueprintDto
  ): Promise<BlueprintRecord> {
    if (dto.blueprint) {
      try {
        // S3: Strict validation with specialized schema
        const result = blueprintStructureSchema.safeParse(dto.blueprint);
        if (!result.success) {
          throw new Error(`Invalid blueprint payload: ${result.error.message}`);
        }

        validateBlueprint(result.data as BlueprintTemplate);
      } catch (e) {
        throw new Error(
          `Invalid blueprint structure: ${e instanceof Error ? e.message : 'Unknown error'}`
        );
      }
    }

    const [updatedBlueprint] = await this.db
      .update(onboardingBlueprintsInGovernance)
      .set({
        plan: dto.plan,
        nicheType: dto.nicheType as
          | 'retail'
          | 'wellness'
          | 'education'
          | 'services'
          | 'hospitality'
          | 'real-estate'
          | 'creative'
          | undefined,
        status: dto.status as 'active' | 'paused' | undefined,
        blueprint: dto.blueprint as BlueprintTemplate,
        isDefault: dto.isDefault,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(onboardingBlueprintsInGovernance.id, id))
      .returning();

    if (!updatedBlueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }

    this.audit.log({
      userId,
      tenantId: 'system',
      action: 'BLUEPRINT_UPDATED',
      entityType: 'onboarding_blueprints',
      entityId: id,
      metadata: dto as Record<string, unknown>,
    });

    return this.mapBlueprintRecord(updatedBlueprint);
  }

  async remove(userId: string, id: string): Promise<BlueprintRecord> {
    const [deleted] = await this.db
      .delete(onboardingBlueprintsInGovernance)
      .where(eq(onboardingBlueprintsInGovernance.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }

    this.audit.log({
      userId,
      tenantId: 'system',
      action: 'BLUEPRINT_DELETED',
      entityType: 'onboarding_blueprints',
      entityId: id,
      metadata: { name: deleted.name },
    });

    return this.mapBlueprintRecord(deleted);
  }

  async snapshot(
    userId: string,
    subdomain: string,
    name: string,
    description?: string,
    _nicheType?: string
  ): Promise<BlueprintRecord> {
    try {
      const blueprintId = await createSnapshot(subdomain, {
        name,
        description,
        isDefault: false,
        plan: 'pro',
      });

      const blueprint = await this.findOne(blueprintId);

      await this.audit.log({
        action: 'BLUEPRINT_SNAPSHOT',
        entityType: 'onboarding_blueprints',
        entityId: blueprintId,
        userId: userId,
        tenantId: 'system',
        metadata: {
          sourceSubdomain: subdomain,
          snapshotName: name,
        },
      });

      return blueprint;
    } catch (error) {
      this.logger.error(
        `[BlueprintsService] Snapshot FAILED for ${subdomain}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Safe mapping from DB record to BlueprintRecord interface
   * Protocol Delta: Resolves string-to-Date mismatch without 'unknown' casting
   */
  private mapBlueprintRecord(raw: any): BlueprintRecord {
    return {
      ...raw,
      blueprint: raw.blueprint as BlueprintTemplate,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : null,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
    };
  }
}
