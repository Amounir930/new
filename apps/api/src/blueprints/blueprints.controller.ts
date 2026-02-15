import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../../../packages/auth/src/guards/super-admin.guard.js'; // Direct import for now, ideally via @apex/auth
import { CurrentUser } from '../../../../packages/auth/src/decorators/current-user.decorator.js'; // Direct import for now
import { BlueprintsService } from './blueprints.service.js';
import { CreateBlueprintDto, UpdateBlueprintDto } from './dto/blueprint.dto.js';

@Controller('admin/blueprints')
@UseGuards(SuperAdminGuard) // Super-#21: Super Admin ONLY
export class BlueprintsController {
    constructor(private readonly blueprintsService: BlueprintsService) { }

    @Get()
    findAll() {
        return this.blueprintsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.blueprintsService.findOne(id);
    }

    @Post()
    create(@CurrentUser('id') userId: string, @Body() dto: CreateBlueprintDto) {
        return this.blueprintsService.create(userId, dto);
    }

    @Put(':id')
    update(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateBlueprintDto
    ) {
        return this.blueprintsService.update(userId, id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.blueprintsService.remove(userId, id);
    }
}
