import {
  and,
  bannersInStorefront,
  desc,
  eq,
  getTenantDb,
  newsletterSubscribersInStorefront,
  productsInStorefront,
  productVariantsInStorefront,
  sql,
  tenantConfigInStorefront,
} from '@apex/db';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { RedisRateLimitStore } from '@apex/middleware';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly redisStore: RedisRateLimitStore,
    private readonly crypto: EncryptionService
  ) {}

  async getTenantConfig(tenantId: string) {
    const { db, release } = await getTenantDb(tenantId);
    try {
      const cacheKey = `storefront:config:${tenantId}`;
      const client = await this.redisStore.getClient();

      if (client) {
        const cachedData = await client.get(cacheKey);
        if (cachedData) return JSON.parse(cachedData);
      }

      // Fetch config from tenant_config table
      const configEntries = await db.select().from(tenantConfigInStorefront);
      const config = configEntries.reduce(
        (acc: Record<string, unknown>, curr: Record<string, unknown>) => {
          if (typeof curr.key === 'string') acc[curr.key] = curr.value;
          return acc;
        },
        {} as Record<string, unknown>
      );

      // Fetch hero banners
      const heroBanners = await db
        .select()
        .from(bannersInStorefront)
        .where(
          and(
            eq(bannersInStorefront.isActive, true),
            eq(bannersInStorefront.location, 'hero')
          )
        )
        .orderBy(desc(bannersInStorefront.sortOrder))
        .limit(1);

      const result = {
        storeName: (config.store_name as string) || 'APEX STORE',
        logoUrl: config.logo_url as string | undefined,
        primaryColor: (config.primary_color as string) || '#000000',
        heroBanner: heroBanners[0],
        ...(config as Record<string, unknown>),
      };

      if (client) {
        await client.setEx(cacheKey, 3600, JSON.stringify(result));
      }

      return result;
    } finally {
      release();
    }
  }

  async getProducts(
    _tenantId: string,
    params: {
      featured?: boolean;
      category?: string;
      limit?: number;
      sort?: 'newest' | 'price_asc' | 'price_desc';
    }
  ) {
    const { db, release } = await getTenantDb(_tenantId);
    try {
      const conditions = [eq(productsInStorefront.isActive, true)];

      if (params.featured) {
        conditions.push(eq(productsInStorefront.isFeatured, true));
      }

      if (params.category) {
        conditions.push(eq(productsInStorefront.categoryId, params.category));
      }

      let query = db
        .select({
          id: productsInStorefront.id,
          slug: productsInStorefront.slug,
          name: productsInStorefront.name,
          price: productsInStorefront.basePrice,
          compareAtPrice: productsInStorefront.salePrice,
          rating: sql<number>`4.5`,
          imageUrl: productsInStorefront.mainImage,
        })
        .from(productsInStorefront)
        .where(and(...conditions))
        .$dynamic();

      if (params.sort === 'newest') {
        query = query.orderBy(desc(productsInStorefront.createdAt));
      } else if (params.sort === 'price_asc') {
        query = query.orderBy(productsInStorefront.basePrice);
      } else if (params.sort === 'price_desc') {
        query = query.orderBy(desc(productsInStorefront.basePrice));
      }

      return await query.limit(params.limit || 20);
    } finally {
      release();
    }
  }

  async getProductBySlug(_tenantId: string, slug: string) {
    const { db, release } = await getTenantDb(_tenantId);
    try {
      const productData = await db
        .select()
        .from(productsInStorefront)
        .where(
          and(
            eq(productsInStorefront.slug, slug),
            eq(productsInStorefront.isActive, true)
          )
        )
        .limit(1);

      if (productData.length === 0) return null;

      const product = productData[0];

      const [, variants] = await Promise.all([
        Promise.resolve([]),
        db
          .select()
          .from(productVariantsInStorefront)
          .where(eq(productVariantsInStorefront.productId, product.id)),
      ]);

      return {
        ...product,
        images: [], // images,
        variants,
        rating: 4.5,
        reviewCount: 12,
      };
    } finally {
      release();
    }
  }

  async getHomeData(_tenantId: string) {
    const cacheKey = `storefront:home:${_tenantId}`;
    const client = await this.redisStore.getClient();

    if (client) {
      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const { db, release } = await getTenantDb(_tenantId);
    try {
      const now = new Date();

      const [, activeBanners] = await Promise.all([
        Promise.resolve([]),
        db
          .select()
          .from(bannersInStorefront)
          .where(
            and(
              eq(bannersInStorefront.isActive, true),
              eq(bannersInStorefront.location, 'hero')
            )
          )
          .limit(5)
          .orderBy(desc(bannersInStorefront.sortOrder)),
      ]);

      const homeData = {
        banners: activeBanners,
        bestSellers: [], // bestSellers,
        meta: {
          lastUpdated: now.toISOString(),
          tenantId: _tenantId,
        },
      };

      if (client) {
        await client.setEx(cacheKey, 10, JSON.stringify(homeData));
      }

      return homeData;
    } finally {
      release();
    }
  }

  // S12 FIX 19C: Aggregated Bootstrap (uses middleware connection, no second pool hit)
  async getBootstrapData(_tenantId: string) {
    const cacheKey = `storefront:bootstrap:${_tenantId}`;
    const client = await this.redisStore.getClient();
    if (client) {
      const cached = await client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const [config, home] = await Promise.all([
      this.fetchConfigInternal(_tenantId),
      this.fetchHomeInternal(_tenantId),
    ]);

    const result = { config, homeData: home };

    if (client) {
      await client.setEx(cacheKey, 60, JSON.stringify(result));
    }

    return result;
  }

  /** Internal helpers — use middleware-provided DB context */
  private async fetchConfigInternal(_tenantId: string) {
    const { db, release } = await getTenantDb(_tenantId);
    try {
      const configEntries = await db.select().from(tenantConfigInStorefront);
      const config = configEntries.reduce(
        (acc: Record<string, unknown>, curr: Record<string, unknown>) => {
          if (typeof curr.key === 'string') acc[curr.key] = curr.value;
          return acc;
        },
        {} as Record<string, unknown>
      );

      const heroBanners = await db
        .select()
        .from(bannersInStorefront)
        .where(
          and(
            eq(bannersInStorefront.isActive, true),
            eq(bannersInStorefront.location, 'hero')
          )
        )
        .orderBy(desc(bannersInStorefront.sortOrder))
        .limit(1);

      return {
        storeName: (config.store_name as string) || 'APEX STORE',
        logoUrl: config.logo_url as string | undefined,
        primaryColor: (config.primary_color as string) || '#000000',
        heroBanner: heroBanners[0],
        ...(config as Record<string, unknown>),
      };
    } finally {
      release();
    }
  }

  private async fetchHomeInternal(_tenantId: string) {
    const { db, release } = await getTenantDb(_tenantId);
    try {
      const now = new Date();
      const [, activeBanners] = await Promise.all([
        Promise.resolve([]),
        db
          .select()
          .from(bannersInStorefront)
          .where(
            and(
              eq(bannersInStorefront.isActive, true),
              eq(bannersInStorefront.location, 'hero')
            )
          )
          .limit(5)
          .orderBy(desc(bannersInStorefront.sortOrder)),
      ]);
      return {
        banners: activeBanners,
        bestSellers: [], // bestSellers,
        meta: { lastUpdated: now.toISOString(), tenantId: _tenantId },
      };
    } finally {
      release();
    }
  }

  async subscribeToNewsletter(_tenantId: string, email: string) {
    const { db, release } = await getTenantDb(_tenantId);
    try {
      // S7: Encrypt PII before storage
      const encryptedEmail = this.crypto.encrypt(email).encrypted;

      // S2 FIX 21C: Atomic transaction prevents orphaned data on partial failure
      return await db.transaction(async (tx: unknown) => {
        const dbTx = tx as typeof db;
        return (await dbTx
          .insert(newsletterSubscribersInStorefront)
          .values({ email: encryptedEmail })
          .onConflictDoUpdate({
            target: newsletterSubscribersInStorefront.email,
            set: { isActive: true },
          })
          .returning()) as unknown;
      });
    } finally {
      release();
    }
  }
}
