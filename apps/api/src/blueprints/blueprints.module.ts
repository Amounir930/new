import { AuditModule } from '@apex/audit';
import { DbModule } from '@apex/db';
import { Module } from '@nestjs/common';
import { BlueprintsController } from './blueprints.controller.js';
import { BlueprintsService } from './blueprints.service.js';

@Module({
  imports: [DbModule, AuditModule],
  controllers: [BlueprintsController],
  providers: [BlueprintsService],
})
export class BlueprintsModule {}
