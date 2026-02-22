import {
  and,
  banners,
  db,
  desc,
  eq,
  gte,
  isNull,
  lte,
  mvBestSellers,
  newsletterSubscribers,
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
  sql,
  tenantConfig,
} from '@apex/db';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { RedisRateLimitStore } from '@apex/middleware';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorefrontService {
  constructor(private readonly redisStore: RedisRateLimitStore) { }

  async getTenantConfig(tenantId?: string) {
    const cacheKey = `storefront:config:${tenantId || 'default'}`;
    const client = await this.redisStore.getClient();

    if (client) {
      const cachedData = await client.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);
    }

    // Fetch config from tenant_config table
    const configEntries = await db.select().from(tenantConfig);
    const config = configEntries.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, any>
    );

    // Fetch hero banners
    const heroBanners = await db
      .select()
      .from(banners)
      .where(and(eq(banners.active, true), eq(banners.position, 'hero')))
      .orderBy(desc(banners.priority))
      .limit(1);

    const result = {
      storeName: config.store_name || 'APEX STORE',
      logoUrl: config.logo_url,
      primaryColor: config.primary_color || '#000000',
      heroBanner: heroBanners[0],
      ...config,
    };

    if (client) {
      await client.setEx(cacheKey, 3600, JSON.stringify(result));
    }

    return result;
  }

  async getProducts(params: {
    featured?: boolean;
    category?: string;
    limit?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }) {
    const conditions = [eq(products.isActive, true)];

    if (params.featured) {
      conditions.push(eq(products.isFeatured, true));
    }

    if (params.category) {
      conditions.push(eq(products.categoryId, params.category));
    }

    let query = db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        rating: sql<number>`4.5`,
        imageUrl: sql<string>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      })
      .from(products)
      .where(and(...conditions))
      .$dynamic();

    if (params.sort === 'newest') {
      query = query.orderBy(desc(products.createdAt));
    } else if (params.sort === 'price_asc') {
      query = query.orderBy(products.price);
    } else if (params.sort === 'price_desc') {
      query = query.orderBy(desc(products.price));
    }

    return query.limit(params.limit || 20);
  }

  async getProductBySlug(slug: string) {
    const productData = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (productData.length === 0) return null;

    const product = productData[0];

    const [images, variants] = await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.order),
      db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id)),
    ]);

    return {
      ...product,
      images,
      variants,
      rating: 4.5,
      reviewCount: 12,
    };
  }

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
    // BR-01-SEC: Use Materialized View for Best Sellers
    const now = new Date();

    const [bestSellers, activeBanners] = await Promise.all([
      // Best Sellers from Materialized View (Fast)
      db.select().from(mvBestSellers).limit(8),

      // Active Banners (BR-01-SEC logic)
      db
        .select()
        .from(banners)
        .where(
          and(
            eq(banners.active, true),
            eq(banners.position, 'hero'),
            // Correct Drizzle logical OR
            sql`(${banners.startDate} IS NULL AND ${banners.endDate} IS NULL) OR 
                            (${banners.startDate} <= ${now} AND ${banners.endDate} >= ${now}) OR
                            (${banners.startDate} <= ${now} AND ${banners.endDate} IS NULL)`
          )
        )
        .limit(5)
        .orderBy(desc(banners.priority)),
    ]);

    const homeData = {
      banners: activeBanners,
      bestSellers,
      meta: {
        lastUpdated: now.toISOString(),
        tenantId: tenantId,
      },
    };

    // 3. Cache results (S6/Performance)
    // BR-01-SEC: TTL 10 seconds for home page
    if (client) {
      await client.setEx(cacheKey, 10, JSON.stringify(homeData));
    }

    return homeData;
  }

  async subscribeToNewsletter(email: string) {
    return db
      .insert(newsletterSubscribers)
      .values({ email })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { status: 'active' },
      })
      .returning();
  }
}
