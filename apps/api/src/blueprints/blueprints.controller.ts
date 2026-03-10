import { AuditLog } from '@apex/audit';
import { CurrentUser, JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { BlueprintsService } from './blueprints.service';
import {
  type CreateBlueprintDto,
  createBlueprintSchema,
  type SnapshotBlueprintDto,
  snapshotBlueprintSchema,
  type UpdateBlueprintDto,
  updateBlueprintSchema,
} from './dto/blueprint.dto';

@Controller('blueprints')
@UseGuards(JwtAuthGuard, SuperAdminGuard) // Super-#21: Super Admin ONLY
export class BlueprintsController {
  private readonly logger = new Logger(BlueprintsController.name);
  constructor(private readonly blueprintsService: BlueprintsService) {}

  @Get()
  async findAll() {
    try {
      return await this.blueprintsService.findAll();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[BlueprintsController] FIND_ALL_ERROR: ${message}`);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blueprintsService.findOne(id);
  }

  @Post()
  @AuditLog({ action: 'BLUEPRINT_CREATED', entityType: 'blueprint' })
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createBlueprintSchema)) dto: CreateBlueprintDto
  ) {
    return this.blueprintsService.create(userId, dto);
  }

  @Put(':id')
  @AuditLog({ action: 'BLUEPRINT_UPDATED', entityType: 'blueprint' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBlueprintSchema)) dto: UpdateBlueprintDto
  ) {
    return this.blueprintsService.update(userId, id, dto);
  }

  @Post('snapshot')
  @AuditLog({ action: 'BLUEPRINT_SNAPSHOT_CREATED', entityType: 'blueprint' })
  snapshot(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(snapshotBlueprintSchema))
    dto: SnapshotBlueprintDto
  ) {
    return this.blueprintsService.snapshot(
      userId,
      dto.subdomain,
      dto.name,
      dto.description,
      dto.nicheType
    );
  }

  @Delete(':id')
  @AuditLog({ action: 'BLUEPRINT_DELETED', entityType: 'blueprint' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blueprintsService.remove(userId, id);
  }
}
