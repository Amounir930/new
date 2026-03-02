import { AuditModule } from '@apex/audit';
import { Module } from '@nestjs/common';
import { BlueprintsController } from './blueprints.controller.js';
import { BlueprintsService } from './blueprints.service.js';

@Module({
  imports: [AuditModule],
  controllers: [BlueprintsController],
  providers: [
    BlueprintsService,
    {
      provide: 'BLUEPRINTS_SERVICE',
      useExisting: BlueprintsService,
    },
  ],
  exports: [BlueprintsService, 'BLUEPRINTS_SERVICE'],
})
export class BlueprintsModule {}
