import type { AuthenticatedRequest } from '@apex/auth';
import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import {
  customersInStorefront,
  eq,
  ordersInStorefront,
  productsInStorefront,
  sql,
} from '@apex/db';
import { isUuid, requireExecutor } from '@apex/middleware';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

@Controller('tenants/stats')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class MerchantStatsController {
  constructor() {}

  @Get()
  async getStats(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId || !isUuid(tenantId)) {
      throw new Error('S2 CRITICAL: Verified Tenant UUID missing in session');
    }

    const db = requireExecutor();

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

      const [customerStats] = await db
        .select({
          totalCustomers: sql<number>`count(*)`,
        })
        .from(customersInStorefront);

      return {
        totalOrders: Number(orderStats?.totalOrders || 0),
        totalRevenue: Number(orderStats?.totalRevenue || 0),
        totalProducts: Number(productStats?.totalProducts || 0),
        totalCustomers: Number(customerStats?.totalCustomers || 0),
      };
    } catch (e) {
      throw e;
    }
  }
}
