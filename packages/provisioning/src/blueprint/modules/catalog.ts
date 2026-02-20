import {
  products,
  categories,
  eq
} from '@apex/db';
import type {
  BlueprintConfig,
  BlueprintContext,
  SeederModule,
} from '../types.js';

export class CatalogModule implements SeederModule {
  name = 'catalog';
  allowedPlans: string[] | '*' = '*'; // Available for all, but content varies by plan

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
      const productsToInsert = productsList.map((p) => ({
        name: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: p.description,
        price: p.price.toString(),
        currency: 'USD',
        categoryId: p.category
          ? categoryMap.get(p.category.toLowerCase())
          : null,
        inventory: p.inventory || 0,
        isActive: true,
      }));

      if (productsToInsert.length > 0) {
        await ctx.db
          .insert(products)
          .values(productsToInsert)
          .onConflictDoNothing();
      }
    } catch (e) {
      console.warn('[CatalogModule] Failed to seed products:', e);
      throw e; // Circuit Breaker will catch this
    }
  }
}
