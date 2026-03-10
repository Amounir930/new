import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import { Controller, Get, UseGuards } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { GovernanceService } from './governance.service';

@Controller('governance')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('stats')
  async getStats() {
    return this.governanceService.getPlatformStats();
  }

  @Get('health')
  async getHealth() {
    return this.governanceService.getInfraHealth();
  }
}
