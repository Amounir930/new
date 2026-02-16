// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { AuditService } from '@apex/audit';
import { onboardingBlueprints } from '@apex/db';
import { validateBlueprint } from '@apex/provisioning';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  CreateBlueprintDto,
  UpdateBlueprintDto,
} from './dto/blueprint.dto.js';

@Injectable()
export class BlueprintsService {
  private db: NodePgDatabase;

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: any,
    private readonly audit: AuditService
  ) {
    this.db = drizzle(this.pool);
  }

  async findAll() {
    return this.db.select().from(onboardingBlueprints);
  }

  async findOne(id: string) {
    const [blueprint] = await this.db
      .select()
      .from(onboardingBlueprints)
      .where(eq(onboardingBlueprints.id, id));

    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }
    return blueprint;
  }

  async create(userId: string, dto: CreateBlueprintDto) {
    // S3: Validate JSON structure
    let parsed: any;
    try {
      parsed = JSON.parse(dto.blueprint);
    } catch (_e) {
      throw new Error('Invalid JSON in blueprint');
    }

    try {
      validateBlueprint(parsed);
    } catch (e: any) {
      throw new Error(`Invalid blueprint structure: ${e.message}`);
    }

    const [newBlueprint] = await this.db
      .insert(onboardingBlueprints)
      .values({
        name: dto.name,
        description: dto.description,
        plan: dto.plan,
        isDefault: dto.isDefault ? 'true' : 'false', // DB stores boolean as text 'true'/'false' based on schema definition? schema says string default 'false'
        blueprint: dto.blueprint,
      })
      .returning();

    // S4: Audit Log
    this.audit.log({
      userId,
      tenantId: 'system', // Blueprints are system-wide
      action: 'BLUEPRINT_CREATED',
      entityType: 'onboarding_blueprints',
      entityId: newBlueprint.id,
      metadata: { name: dto.name, plan: dto.plan },
    });

    return newBlueprint;
  }

  async update(userId: string, id: string, dto: UpdateBlueprintDto) {
    if (dto.blueprint) {
      let parsed: any;
      try {
        // If it's a string, parse it. If it's already an object (from DTO validation), use it.
        // DTO says string, so parse.
        parsed = JSON.parse(dto.blueprint);
      } catch {
        throw new Error('Invalid JSON in blueprint');
      }

      try {
        validateBlueprint(parsed);
      } catch (e: any) {
        throw new Error(`Invalid blueprint structure: ${e.message}`);
      }
    }

    const [updatedBlueprint] = await this.db
      .update(onboardingBlueprints)
      .set({
        ...dto,
        isDefault:
          dto.isDefault !== undefined
            ? dto.isDefault
              ? 'true'
              : 'false'
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(onboardingBlueprints.id, id))
      .returning();

    if (!updatedBlueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }

    // S4: Audit Log
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

  async remove(userId: string, id: string) {
    const [deleted] = await this.db
      .delete(onboardingBlueprints)
      .where(eq(onboardingBlueprints.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }

    // S4: Audit Log
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
}
