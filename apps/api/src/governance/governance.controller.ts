import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { GovernanceService } from './governance.service.js';

@Controller('admin/governance')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) { }

  @Get('stats')
  async getStats() {
    return this.governanceService.getPlatformStats();
  }

  @Get('health')
  async getHealth() {
    return this.governanceService.getInfraHealth();
  }
}
