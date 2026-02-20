import { Injectable } from '@nestjs/common';
import { db, eq, desc, products } from '@apex/db';
import { RedisRateLimitStore } from '@apex/middleware';

@Injectable()
export class StorefrontService {
    constructor(private readonly redisStore: RedisRateLimitStore) { }

    async getHomeData(tenantId?: string) {
        const cacheKey = `storefront:home:${tenantId || 'default'}`;
        const client = await this.redisStore.getClient();

        // Try to get from cache
        if (client) {
            const cachedData = await client.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        }

        // Note: TenantIsolationMiddleware handles search_path automatically for S2
        // We just query as if it's a single DB

        const bestSellers = await db
            .select()
            .from(products)
            .where(eq(products.isActive, true))
            .limit(8)
            .orderBy(desc(products.createdAt));

        // For now, banners are mocked until we have the banner table
        const banners = [
            {
                id: '1',
                title: 'Summer Collection 2026',
                subtitle: 'Up to 50% Off',
                imageUrl: 'https://placehold.co/1200x400?text=Summer+Collection',
                link: '/category/summer',
            },
            {
                id: '2',
                title: 'Tech Revolution',
                subtitle: 'Latest Gadgets',
                imageUrl: 'https://placehold.co/1200x400?text=Tech+Revolution',
                link: '/category/tech',
            },
        ];

        const homeData = {
            banners,
            bestSellers,
        };

        // Store in cache for 5 minutes
        if (client) {
            await client.setEx(cacheKey, 300, JSON.stringify(homeData));
        }

        return homeData;
    }
}
