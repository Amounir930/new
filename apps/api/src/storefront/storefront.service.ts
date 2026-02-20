import { Injectable } from '@nestjs/common';
import { db, eq, desc, products, banners, and, isNull, lte, gte } from '@apex/db';
import { RedisRateLimitStore } from '@apex/middleware';

@Injectable()
export class StorefrontService {
    constructor(private readonly redisStore: RedisRateLimitStore) { }

    async getHomeData(tenantId?: string) {
        const cacheKey = `storefront:home:${tenantId || 'default'}`;
        const client = await this.redisStore.getClient();

        // 1. Try to get from cache (S6/Performance)
        if (client) {
            const cachedData = await client.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        }

        // 2. Fetch fresh data with parallel queries (S3/Performance)
        const now = new Date();

        const [bestSellers, activeBanners] = await Promise.all([
            // Best Sellers
            db.select()
                .from(products)
                .where(eq(products.isActive, true))
                .limit(8)
                .orderBy(desc(products.createdAt)),

            // Active Banners (BR-01-SEC logic)
            db.select()
                .from(banners)
                .where(
                    and(
                        eq(banners.active, true),
                        eq(banners.position, 'hero'),
                        // Check if within date range or dates are null
                        and(
                            and(
                                isNull(banners.startDate),
                                isNull(banners.endDate)
                            ) ||
                            and(
                                lte(banners.startDate, now),
                                gte(banners.endDate, now)
                            ) ||
                            and(
                                lte(banners.startDate, now),
                                isNull(banners.endDate)
                            )
                        )
                    )
                )
                .limit(5)
                .orderBy(desc(banners.priority))
        ]);

        const homeData = {
            banners: activeBanners,
            bestSellers,
            meta: {
                lastUpdated: now.toISOString(),
                tenantId: tenantId
            }
        };

        // 3. Cache results (S6/Performance)
        if (client) {
            await client.setEx(cacheKey, 300, JSON.stringify(homeData));
        }

        return homeData;
    }
}
