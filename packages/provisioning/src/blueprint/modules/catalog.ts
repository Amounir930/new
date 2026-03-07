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

    // 1. Seed Categories
    if (config.categories && config.categories.length > 0) {
      const categoryEntries = config.categories.map((c) => ({
        id: c.id,
        tenantId: storeId!,
        parentId: c.parentId || null,
        slug: c.slug || `cat-${Math.random().toString(36).slice(2, 7)}`,
        name: { ar: c.title, en: c.title },
        description: c.description
          ? { ar: c.description, en: c.description }
          : null,
        imageUrl: c.image || null,
        isActive: true,
      }));

      await db
        .insert(categoriesInStorefront)
        .values(categoryEntries)
        .onConflictDoNothing();
    }

    // 2. Seed Products
    if (config.products && config.products.length > 0) {
      const productEntries = config.products.map((p) => ({
        id: p.id,
        tenantId: storeId!,
        slug: p.slug || `prod-${Math.random().toString(36).slice(2, 7)}`,
        sku: p.sku || p.slug || `sku-${Math.random().toString(36).slice(2, 7)}`,
        name: { ar: p.title, en: p.title },
        shortDescription: p.description
          ? { ar: p.description, en: p.description }
          : null,
        basePrice: String(p.basePrice || p.price || '0'),
        mainImage: p.image || (p.images && p.images[0]) || '',
        categoryId: p.categoryId || null,
        isActive: true,
      }));

      await db
        .insert(productsInStorefront)
        .values(productEntries)
        .onConflictDoNothing();
    }

    // 3. Seed Banners
    if (config.banners && config.banners.length > 0) {
      const bannerEntries = config.banners.map((b) => ({
        id: b.id,
        tenantId: storeId!,
        location: b.location || 'home_top',
        imageUrl: b.imageUrl,
        linkUrl: b.link || null,
        title: b.title ? { ar: b.title, en: b.title } : null,
        isActive: b.isActive !== false,
        sortOrder: b.sortOrder || 0,
      }));

      await db
        .insert(bannersInStorefront)
        .values(bannerEntries)
        .onConflictDoNothing();
    }
  }
}
