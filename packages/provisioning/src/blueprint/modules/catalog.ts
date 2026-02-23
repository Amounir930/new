import { banners, categories, eq, productImages, products } from '@apex/db';
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
            name: c.name,
            slug: c.slug,
            description: c.description,
            isActive: true,
          })
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

        const [insertedProduct] = await ctx.db
          .insert(products)
          .values({
            name: p.name,
            slug: slug,
            description: p.description,
            price: p.price.toString(),
            currency: (ctx.uiConfig?.currency as string) || 'USD',
            categoryId: p.category
              ? categoryMap.get(p.category.toLowerCase())
              : null,
            brand: p.brand || null,
            quantity: p.inventory || 0,
            isFeatured: !!p.isFeatured,
            isActive: true,
          } as any)
          .onConflictDoUpdate({
            target: products.slug,
            set: { name: p.name, price: p.price.toString() } as any,
          })
          .returning();

        // Seed Product Images
        if (p.images && p.images.length > 0 && insertedProduct) {
          const imagesToInsert = p.images.map((img: string, index: number) => ({
            productId: insertedProduct.id,
            url: img,
            isPrimary: index === 0,
            order: index,
          }));

          await ctx.db
            .insert(productImages)
            .values(imagesToInsert)
            .onConflictDoNothing();
        }
      }
    } catch (e) {
      console.warn('[CatalogModule] Failed to seed products:', e);
      throw e;
    }
  }

  private async seedBanners(ctx: BlueprintContext, bannersList: any[]) {
    try {
      const bannersToInsert = bannersList.map((b) => ({
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl || '/',
        ctaText: b.ctaText || 'Shop Now',
        position: b.position || 'hero',
        priority: b.priority || 0,
        active: true,
      }));

      await ctx.db
        .insert(banners)
        .values(bannersToInsert)
        .onConflictDoNothing();
    } catch (e) {
      console.warn('[CatalogModule] Failed to seed banners:', e);
    }
  }
}
