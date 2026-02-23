import {
  and,
  banners,
  db,
  dbContextStorage,
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
import { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly redisStore: RedisRateLimitStore,
    private readonly crypto: EncryptionService
  ) { }

  // S2 FIX 19C: Get pre-configured DB executor from middleware (no second connection)
  private getDb() {
    const db = dbContextStorage.getStore();
    if (!db) throw new Error('S2 CRITICAL: Database context missing! Request not routed through TenantIsolationMiddleware.');
    return db;
  }

  async getTenantConfig(tenantId: string) {
    const db = this.getDb();
    const cacheKey = `storefront:config:${tenantId}`;
    const client = await this.redisStore.getClient();

    if (client) {
      const cachedData = await client.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);
    }

    // Fetch config from tenant_config table
    const configEntries = await db.select().from(tenantConfig);
    const config = configEntries.reduce(
      (acc: Record<string, any>, curr: any) => {
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

  async getProducts(tenantId: string, params: {
    featured?: boolean;
    category?: string;
    limit?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }) {
    const db = this.getDb();
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
        name: products.nameEn,
        price: products.basePrice,
        compareAtPrice: products.salePrice,
        rating: sql<number>`4.5`,
        imageUrl: products.mainImage,
      })
      .from(products)
      .where(and(...conditions))
      .$dynamic();

    if (params.sort === 'newest') {
      query = query.orderBy(desc(products.createdAt));
    } else if (params.sort === 'price_asc') {
      query = query.orderBy(products.basePrice);
    } else if (params.sort === 'price_desc') {
      query = query.orderBy(desc(products.basePrice));
    }

    return query.limit(params.limit || 20);
  }

  async getProductBySlug(tenantId: string, slug: string) {
    const db = this.getDb();
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

  async getHomeData(tenantId: string) {
    const db = this.getDb();
    const cacheKey = `storefront:home:${tenantId}`;
    const client = await this.redisStore.getClient();

    if (client) {
      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const now = new Date();

    const [bestSellers, activeBanners] = await Promise.all([
      db.select().from(mvBestSellers).limit(8),
      db
        .select()
        .from(banners)
        .where(
          and(
            eq(banners.active, true),
            eq(banners.position, 'hero'),
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

    if (client) {
      await client.setEx(cacheKey, 10, JSON.stringify(homeData));
    }

    return homeData;
  }

  // S12 FIX 19C: Aggregated Bootstrap (uses middleware connection, no second pool hit)
  async getBootstrapData(tenantId: string) {
    const cacheKey = `storefront:bootstrap:${tenantId}`;
    const client = await this.redisStore.getClient();
    if (client) {
      const cached = await client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const [config, home] = await Promise.all([
      this.fetchConfigInternal(tenantId),
      this.fetchHomeInternal(tenantId),
    ]);

    const result = { config, homeData: home };

    if (client) {
      await client.setEx(cacheKey, 60, JSON.stringify(result));
    }

    return result;
  }

  /** Internal helpers — use middleware-provided DB context */
  private async fetchConfigInternal(tenantId: string) {
    const db = this.getDb();
    const configEntries = await db.select().from(tenantConfig);
    const config = configEntries.reduce((acc: Record<string, any>, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    const heroBanners = await db.select().from(banners)
      .where(and(eq(banners.active, true), eq(banners.position, 'hero')))
      .orderBy(desc(banners.priority)).limit(1);

    return {
      storeName: config.store_name || 'APEX STORE',
      logoUrl: config.logo_url,
      primaryColor: config.primary_color || '#000000',
      heroBanner: heroBanners[0],
      ...config,
    };
  }

  private async fetchHomeInternal(tenantId: string) {
    const db = this.getDb();
    const now = new Date();
    const [bestSellers, activeBanners] = await Promise.all([
      db.select().from(mvBestSellers).limit(8),
      db.select().from(banners).where(and(eq(banners.active, true), eq(banners.position, 'hero'),
        sql`(${banners.startDate} IS NULL AND ${banners.endDate} IS NULL) OR (${banners.startDate} <= ${now} AND ${banners.endDate} >= ${now})`
      )).limit(5).orderBy(desc(banners.priority)),
    ]);
    return { banners: activeBanners, bestSellers, meta: { lastUpdated: now.toISOString(), tenantId } };
  }

  async subscribeToNewsletter(tenantId: string, email: string) {
    const db = this.getDb();
    // S7: Encrypt PII before storage
    const encryptedEmail = this.crypto.encrypt(email).encrypted;

    // S2 FIX 21C: Atomic transaction prevents orphaned data on partial failure
    return db.transaction(async (tx) => {
      return tx
        .insert(newsletterSubscribers)
        .values({ email: encryptedEmail })
        .onConflictDoUpdate({
          target: newsletterSubscribers.email,
          set: { status: 'active' },
        })
        .returning();
    });
  }
}
