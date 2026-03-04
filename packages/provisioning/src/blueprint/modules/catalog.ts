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
      const categoryEntries = (config.categories as never[]).map(
        (c: unknown) => ({
          ...c,
          tenantId: storeId,
        })
      );

      await db
        .insert(categoriesInStorefront)
        .values(categoryEntries as never)
        .onConflictDoNothing();
    }

    // 2. Seed Products
    if (config.products && config.products.length > 0) {
      const productEntries = (config.products as never[]).map((p: unknown) => ({
        ...p,
        tenantId: storeId,
      }));

      await db
        .insert(productsInStorefront)
        .values(productEntries as never)
        .onConflictDoNothing();
    }

    // 3. Seed Banners
    if (config.banners && config.banners.length > 0) {
      const bannerEntries = (config.banners as never[]).map((b: unknown) => ({
        ...b,
        tenantId: storeId,
      }));

      await db
        .insert(bannersInStorefront)
        .values(bannerEntries as never)
        .onConflictDoNothing();
    }
  }
}
