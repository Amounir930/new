/**
 * Catalog Module
 * Seeds categories, products, and banners
 */

import {
  bannersInStorefront,
  categoriesInStorefront,
  productsInStorefront,
} from '@apex/db';
import type { BlueprintConfig, BlueprintContext, SeederModule } from '../types';

export class CatalogModule implements SeederModule {
  name = 'catalog';

  async run(context: BlueprintContext, config: BlueprintConfig): Promise<void> {
    const { db, storeId } = context;
    const { sql } = await import('drizzle-orm');

    // 1. Seed Categories
    if (config.categories && config.categories.length > 0) {
      for (const c of config.categories) {
        await db.execute(sql`
          INSERT INTO "_categories" ("id", "tenant_id", "parent_id", "slug", "name", "description", "image_url", "is_active")
          VALUES (${c.id}, ${storeId}, ${c.parentId || null}, ${c.slug || `cat-${Math.random().toString(36).slice(2, 7)}`}, 
                  ${JSON.stringify({ ar: c.title, en: c.title })}, 
                  ${c.description ? JSON.stringify({ ar: c.description, en: c.description }) : null}, 
                  ${c.image || null}, true)
          ON CONFLICT DO NOTHING
        `);
      }
    }

    // 2. Seed Products
    if (config.products && config.products.length > 0) {
      for (const p of config.products) {
        await db.execute(sql`
          INSERT INTO "_products" ("id", "tenant_id", "slug", "sku", "name", "short_description", "base_price", "main_image", "category_id", "is_active")
          VALUES (${p.id}, ${storeId}, ${p.slug || `prod-${Math.random().toString(36).slice(2, 7)}`}, 
                  ${p.sku || p.slug || `sku-${Math.random().toString(36).slice(2, 7)}`}, 
                  ${JSON.stringify({ ar: p.title, en: p.title })}, 
                  ${p.description ? JSON.stringify({ ar: p.description, en: p.description }) : null}, 
                  ${String(p.basePrice || p.price || '0')}, 
                  ${p.image || (p.images && p.images[0]) || ''}, 
                  ${p.categoryId || null}, true)
          ON CONFLICT DO NOTHING
        `);
      }
    }

    // 3. Seed Banners
    if (config.banners && config.banners.length > 0) {
      for (const b of config.banners) {
        await db.execute(sql`
          INSERT INTO "banners" ("id", "tenant_id", "location", "image_url", "link_url", "title", "is_active", "sort_order")
          VALUES (${b.id}, ${storeId}, ${b.location || 'home_top'}, ${b.imageUrl}, ${b.link || null}, 
                  ${b.title ? JSON.stringify({ ar: b.title, en: b.title }) : null}, 
                  ${b.isActive !== false}, ${b.sortOrder || 0})
          ON CONFLICT DO NOTHING
        `);
      }
    }
  }
}
