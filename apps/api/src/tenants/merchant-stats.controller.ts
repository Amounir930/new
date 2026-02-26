import { type AuthenticatedRequest, JwtAuthGuard } from '@apex/auth';
// biome-ignore lint/style/useImportType: DI
import { MerchantStatsService } from '@apex/db';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

@Controller('tenants/stats')
@UseGuards(JwtAuthGuard)
export class MerchantStatsController {
  constructor(private readonly statsService: MerchantStatsService) {}

  @Get()
  async getStats(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) throw new Error('S2 CRITICAL: Tenant context missing');
    return this.statsService.getDashboardStats();
  }
}
