// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { AuditService } from '@apex/audit';
import {
  type NodePgDatabase,
  drizzle,
  eq,
  onboardingBlueprints,
  sql,
} from '@apex/db';
import type { BlueprintRecord, BlueprintTemplate } from '@apex/provisioning';
import { SnapshotManager, validateBlueprint } from '@apex/provisioning';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import type {
  CreateBlueprintDto,
  UpdateBlueprintDto,
} from './dto/blueprint.dto.js';

@Injectable()
export class BlueprintsService {
  private db: NodePgDatabase<Record<string, unknown>>;

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly audit: AuditService
  ) {
    this.db = drizzle(this.pool);
  }

  async findAll(): Promise<BlueprintRecord[]> {
    return (await this.db
      .select()
      .from(onboardingBlueprints)) as BlueprintRecord[];
  }

  async findOne(id: string): Promise<BlueprintRecord> {
    const [blueprint] = (await this.db
      .select()
      .from(onboardingBlueprints)
      .where(eq(onboardingBlueprints.id, id))) as BlueprintRecord[];

    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }
    return blueprint;
  }

  async create(
    userId: string,
    dto: CreateBlueprintDto
  ): Promise<BlueprintRecord> {
    const blueprintData = dto.blueprint as unknown as BlueprintTemplate;

    try {
      validateBlueprint(blueprintData);
    } catch (e) {
      throw new Error(
        `Invalid blueprint structure: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    }

    const [newBlueprint] = (await this.db
      .insert(onboardingBlueprints)
      .values({
        name: dto.name,
        description: dto.description || null,
        plan: dto.plan,
        nicheType: dto.nicheType || 'retail',
        status: dto.status || 'active',
        uiConfig: dto.uiConfig || {},
        isDefault: dto.isDefault,
        blueprint: blueprintData,
      })
      .returning()) as BlueprintRecord[];

    this.audit.log({
      userId,
      tenantId: 'system',
      action: 'BLUEPRINT_CREATED',
      entityType: 'onboarding_blueprints',
      entityId: newBlueprint.id,
      metadata: { name: dto.name, plan: dto.plan },
    });

    return newBlueprint;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBlueprintDto
  ): Promise<BlueprintRecord> {
    if (dto.blueprint) {
      try {
        validateBlueprint(dto.blueprint as unknown as BlueprintTemplate);
      } catch (e) {
        throw new Error(
          `Invalid blueprint structure: ${e instanceof Error ? e.message : 'Unknown error'}`
        );
      }
    }

    const [updatedBlueprint] = (await this.db
      .update(onboardingBlueprints)
      .set({
        plan: dto.plan,
        nicheType: dto.nicheType ?? undefined,
        status: dto.status,
        blueprint: dto.blueprint as unknown as BlueprintTemplate,
        isDefault: dto.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(onboardingBlueprints.id, id))
      .returning()) as BlueprintRecord[];

    if (!updatedBlueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }

    this.audit.log({
      userId,
      tenantId: 'system',
      action: 'BLUEPRINT_UPDATED',
      entityType: 'onboarding_blueprints',
      entityId: id,
      metadata: dto,
    });

    return updatedBlueprint;
  }

  async remove(userId: string, id: string): Promise<BlueprintRecord> {
    const [deleted] = (await this.db
      .delete(onboardingBlueprints)
      .where(eq(onboardingBlueprints.id, id))
      .returning()) as BlueprintRecord[];

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

    return deleted;
  }

  async snapshot(
    userId: string,
    subdomain: string,
    name: string,
    description?: string,
    nicheType?: string
  ): Promise<BlueprintRecord> {
    try {
      const manager = new SnapshotManager();
      const template = await manager.createSnapshot(subdomain);

      await this.db.execute(sql`SET search_path TO public`);

      const [newBlueprint] = (await this.db
        .insert(onboardingBlueprints)
        .values({
          name: name,
          description: description || template.description || null,
          plan: 'custom',
          nicheType: nicheType || 'retail',
          status: 'active',
          isDefault: false,
          blueprint: template as any as BlueprintTemplate, // Type bridge for snapshot
        })
        .returning()) as BlueprintRecord[];

      await this.audit.log({
        action: 'BLUEPRINT_SNAPSHOT',
        entityType: 'BLUEPRINT',
        entityId: newBlueprint.id,
        userId: userId,
        metadata: {
          sourceSubdomain: subdomain,
          snapshotName: name,
        },
      });

      return newBlueprint;
    } catch (error) {
      console.error(
        `[BlueprintsService] Snapshot FAILED for ${subdomain}:`,
        error
      );
      throw error;
    }
  }
}
