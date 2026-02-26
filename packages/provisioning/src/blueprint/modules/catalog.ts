import { banners, categories, eq, products } from '@apex/db';
import type {
  BlueprintConfig,
  BlueprintContext,
  SeederModule,
} from '../types.js';

export class CatalogModule implements SeederModule {
  name = 'catalog';
  allowedPlans: ('free' | 'basic' | 'pro' | 'enterprise')[] | '*' = '*'; // Available for all, but content varies by plan

  async run(ctx: BlueprintContext, config: BlueprintConfig) {
    if (!config.modules.catalog) {
      return;
    }

    // 1. Categories
    const categoryMap = await this.seedCategories(ctx, config.categories || []);

    // 2. Products
    if (config.products && config.products.length > 0) {
      await this.seedProducts(ctx, config.products, categoryMap);
    }

    // 3. Banners (BR-01-SEC Compliance)
    if (config.banners && config.banners.length > 0) {
      await this.seedBanners(ctx, config.banners);
    }
  }

  private async seedCategories(
    ctx: BlueprintContext,
    categoriesList: any[]
  ): Promise<Map<string, string>> {
    const categoryMap = new Map<string, string>();

    if (categoriesList.length === 0) return categoryMap;

    for (const c of categoriesList) {
      try {
        const [inserted] = await ctx.db
          .insert(categories)
          .values({
            tenantId: ctx.storeId || '',
            name: { en: c.name, ar: c.name },
            slug: c.slug,
            description: c.description
              ? { en: c.description, ar: c.description }
              : null,
            isActive: true,
          } as any)
          .onConflictDoNothing()
          .returning({ id: categories.id, slug: categories.slug });

        if (inserted) {
          categoryMap.set(inserted.slug, inserted.id);
        } else {
          // If conflict, we need to fetch the existing ID to map products correctly
          // This is crucial for idempotency
          const [existing] = await ctx.db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, c.slug));

          if (existing) {
            categoryMap.set(c.slug, existing.id);
          }
        }
      } catch (e) {
        console.warn(`[CatalogModule] Failed to seed category ${c.slug}:`, e);
      }
    }
    return categoryMap;
  }

  private async seedProducts(
    ctx: BlueprintContext,
    productsList: any[],
    categoryMap: Map<string, string>
  ) {
    try {
      for (const p of productsList) {
        // Support Arabic slugs by allowing Arabic unicode range in regex
        const slug =
          p.slug ||
          p.name
            .toLowerCase()
            .replace(/[^\u0600-\u06FFa-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const [_insertedProduct] = await ctx.db
          .insert(products)
          .values({
            tenantId: ctx.storeId || '',
            name: { en: p.name, ar: p.name },
            slug: slug,
            sku:
              p.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            description: p.description
              ? { en: p.description, ar: p.description }
              : null,
            basePrice: p.price?.toString() || '0',
            categoryId: p.category
              ? categoryMap.get(p.category.toLowerCase())
              : null,
            brandId: p.brand || null,
            isFeatured: !!p.isFeatured,
            isActive: true,
            mainImage: p.images?.[0] ?? null,
          } as any)
          .onConflictDoUpdate({
            target: products.slug,
            set: { name: { en: p.name, ar: p.name } } as any,
          })
          .returning();
      }
    } catch (e) {
      console.warn('[CatalogModule] Failed to seed products:', e);
      throw e;
    }
  }

  private async seedBanners(ctx: BlueprintContext, bannersList: any[]) {
    try {
      const bannersToInsert = bannersList.map(
        (b) =>
          ({
            tenantId: ctx.storeId || '',
            title: { en: b.title, ar: b.title },
            subtitle: b.subtitle,
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl || '/',
            ctaText: b.ctaText || 'Shop Now',
            position: b.position || 'hero',
            priority: b.priority || 0,
            isActive: b.active ?? true,
          }) as any
      );

      await ctx.db
        .insert(banners)
        .values(bannersToInsert)
        .onConflictDoNothing();
    } catch (e) {
      console.warn('[CatalogModule] Failed to seed banners:', e);
    }
  }
}
