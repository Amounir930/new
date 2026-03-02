/**
 * Catalog Module
 * Seeds categories, products, and banners
 */

import {
  bannersInStorefront,
  categoriesInStorefront,
  productsInStorefront,
} from '@apex/db';
import type {
  BlueprintConfig,
  BlueprintContext,
  SeederModule,
} from '../types.js';

export class CatalogModule implements SeederModule {
  name = 'catalog';

  async run(context: BlueprintContext, config: BlueprintConfig): Promise<void> {
    const { db, storeId } = context;

    // 1. Seed Categories
    if (config.categories && config.categories.length > 0) {
      const categoryEntries = (config.categories as any[]).map((c: any) => ({
        ...c,
        tenantId: storeId,
      }));

      await db
        .insert(categoriesInStorefront)
        .values(categoryEntries as any)
        .onConflictDoNothing();
    }

    // 2. Seed Products
    if (config.products && config.products.length > 0) {
      const productEntries = (config.products as any[]).map((p: any) => ({
        ...p,
        tenantId: storeId,
      }));

      await db
        .insert(productsInStorefront)
        .values(productEntries as any)
        .onConflictDoNothing();
    }

    // 3. Seed Banners
    if (config.banners && config.banners.length > 0) {
      const bannerEntries = (config.banners as any[]).map((b: any) => ({
        ...b,
        tenantId: storeId,
      }));

      await db
        .insert(bannersInStorefront)
        .values(bannerEntries as any)
        .onConflictDoNothing();
    }
  }
}
