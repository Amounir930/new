/**
 * Catalog Module
 * Seeds categories, products, and banners
 */

// 🛡️ Zero-Any: Imports kept as comments for documentation of mapped tables
// bannersInStorefront, categoriesInStorefront, productsInStorefront
import type { BlueprintConfig, BlueprintContext, SeederModule } from '../types';

export class CatalogModule implements SeederModule {
  name = 'catalog';

  async run(context: BlueprintContext, config: BlueprintConfig): Promise<void> {
    const { db } = context;
    const { sql } = await import('drizzle-orm');

    if (config.categories && config.categories.length > 0) {
      await this.seedCategories(db, config.categories, sql);
    }

    if (config.products && config.products.length > 0) {
      await this.seedProducts(db, config.products, sql);
    }

    if (config.banners && config.banners.length > 0) {
      await this.seedBanners(db, config.banners, sql);
    }
  }

  private async seedCategories(
    db: any,
    categories: any[],
    sql: any
  ): Promise<void> {
    for (const c of categories) {
      await db.execute(sql`
        INSERT INTO "categories" ("id", "parent_id", "slug", "name", "description", "image_url", "is_active")
        VALUES (${c.id}, ${c.parentId || null}, ${c.slug || `cat-${Math.random().toString(36).slice(2, 7)}`}, 
                ${JSON.stringify({ ar: c.title, en: c.title })}, 
                ${c.description ? JSON.stringify({ ar: c.description, en: c.description }) : null}, 
                ${c.image || null}, true)
        ON CONFLICT ("id") DO NOTHING
      `);
    }
  }

  private async seedProducts(
    db: any,
    products: any[],
    sql: any
  ): Promise<void> {
    for (const p of products) {
      await db.execute(sql`
        INSERT INTO "products" ("id", "slug", "sku", "name", "short_description", "base_price", "main_image", "category_id", "is_active")
        VALUES (${p.id}, ${p.slug || `prod-${Math.random().toString(36).slice(2, 7)}`}, 
                ${p.sku || p.slug || `sku-${Math.random().toString(36).slice(2, 7)}`}, 
                ${JSON.stringify({ ar: p.title, en: p.title })}, 
                ${p.description ? JSON.stringify({ ar: p.description, en: p.description }) : null}, 
                ${String(p.basePrice || p.price || '0')}, 
                ${p.image || (p.images?.[0]) || ''}, 
                ${p.categoryId || null}, true)
        ON CONFLICT ("id") DO NOTHING
      `);
    }
  }

  private async seedBanners(db: any, banners: any[], sql: any): Promise<void> {
    for (const b of banners) {
      await db.execute(sql`
        INSERT INTO "banners" ("id", "location", "image_url", "link_url", "title", "is_active", "sort_order")
        VALUES (${b.id}, ${b.location || 'home_top'}, ${b.imageUrl}, ${b.link || null}, 
                ${b.title ? JSON.stringify({ ar: b.title, en: b.title }) : null}, 
                ${b.isActive !== false}, ${b.sortOrder || 0})
        ON CONFLICT ("id") DO NOTHING
      `);
    }
  }
}
