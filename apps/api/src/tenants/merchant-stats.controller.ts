import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@apex/auth';
import { MerchantStatsService } from '@apex/db';

@Controller('tenants/stats')
@UseGuards(JwtAuthGuard)
export class MerchantStatsController {
    constructor(private readonly statsService: MerchantStatsService) { }

    @Get()
    async getStats() {
        return this.statsService.getDashboardStats();
    }
}
