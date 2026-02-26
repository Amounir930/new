import { Injectable } from '@nestjs/common';
import { count, isNull, ne, sql } from 'drizzle-orm';
import { publicDb } from '../connection.js';
import { customers } from '../schema/storefront/customers.js';
import { orders } from '../schema/storefront/orders.js';
import { products } from '../schema/storefront/products.js';

@Injectable()
export class MerchantStatsService {
  /**
   * Get operational statistics for the current tenant.
   * Assumes search_path is already set by TenantIsolationMiddleware (S2).
   */
  async getDashboardStats() {
    // 1. Total Revenue (Sum of delivered/processing orders - excluding cancelled)
    // Note: orders table uses status-based filtering — no deletedAt column by design.
    const [revenueResult] = await publicDb
      .select({
        revenue: sql<string>`COALESCE(SUM(${orders.total}), '0')`,
      })
      .from(orders)
      .where(ne(orders.status, 'cancelled'));

    // 2. Total Orders (Excluding cancelled)
    const [ordersCount] = await publicDb
      .select({ count: count() })
      .from(orders)
      .where(ne(orders.status, 'cancelled'));

    // 3. Total Products (Excluding deleted)
    const [productsCount] = await publicDb
      .select({ count: count() })
      .from(products)
      .where(isNull(products.deletedAt));

    // 4. Total Customers (Excluding deleted)
    const [customersCount] = await publicDb
      .select({ count: count() })
      .from(customers)
      .where(isNull(customers.deletedAt));

    return {
      totalRevenue: Number(revenueResult?.revenue || 0),
      totalOrders: ordersCount?.count || 0,
      totalProducts: productsCount?.count || 0,
      totalCustomers: customersCount?.count || 0,
    };
  }
}
