import { Injectable } from '@nestjs/common';
import { count, sql } from 'drizzle-orm';
import { publicDb } from '../connection.js';
import { orders } from '../schema/storefront/orders.js';
import { products } from '../schema/storefront/products.js';
import { customers } from '../schema/storefront/customers.js';

@Injectable()
export class MerchantStatsService {
    /**
     * Get operational statistics for the current tenant.
     * Assumes search_path is already set by TenantIsolationMiddleware (S2).
     */
    async getDashboardStats() {
        // 1. Total Revenue (Sum of delivered/processing orders)
        const [revenueResult] = await publicDb
            .select({
                revenue: sql<string>`COALESCE(SUM(${orders.total}), '0')`
            })
            .from(orders);

        // 2. Total Orders
        const [ordersCount] = await publicDb
            .select({ count: count() })
            .from(orders);

        // 3. Total Products (Active)
        const [productsCount] = await publicDb
            .select({ count: count() })
            .from(products);

        // 4. Total Customers
        const [customersCount] = await publicDb
            .select({ count: count() })
            .from(customers);

        return {
            totalRevenue: Number(revenueResult?.revenue || 0),
            totalOrders: ordersCount?.count || 0,
            totalProducts: productsCount?.count || 0,
            totalCustomers: customersCount?.count || 0,
        };
    }
}
