import { type AuthenticatedRequest, JwtAuthGuard } from '@apex/auth';
import {
  eq,
  getTenantDb,
  ordersInStorefront,
  productsInStorefront,
  sql,
} from '@apex/db';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

@Controller('tenants/stats')
@UseGuards(JwtAuthGuard)
export class MerchantStatsController {
  @Get()
  async getStats(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) throw new Error('S2 CRITICAL: Tenant context missing');
    const { db, release } = await getTenantDb(tenantId);
    try {
      // Basic aggregate stats query
      const [orderStats] = await db
        .select({
          totalOrders: sql<number>`count(*)`,
          totalRevenue: sql<number>`COALESCE(sum(${ordersInStorefront.total}), 0)`,
        })
        .from(ordersInStorefront);

      const [productStats] = await db
        .select({
          totalProducts: sql<number>`count(*)`,
        })
        .from(productsInStorefront)
        .where(eq(productsInStorefront.isActive, true));

      return {
        ...orderStats,
        ...productStats,
      };
    } finally {
      release();
    }
  }
}
