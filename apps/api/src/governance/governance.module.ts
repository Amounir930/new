import { RateLimitModule } from '@apex/middleware';
import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller.js';
import { GovernanceService } from './governance.service.js';
@Module({
  imports: [RateLimitModule],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
