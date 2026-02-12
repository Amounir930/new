/**
 * Home Page Blueprint Service
 *
 * Handles persistence and retrieval of structured home page data (Header, Hero, Bento, etc.)
 */

import {
  type HomePageBlueprint,
  HomePageBlueprintSchema,
} from '@apex/validators';
import { eq, sql } from 'drizzle-orm';
import { db } from '../connection';
import {
  type FlashSaleProduct,
  type TenantConfig,
  bentoGrids,
  flashSaleProducts,
  flashSales,
  searchAnalytics,
  tenantConfig,
} from '../schema/storefront';

export class HomePageService {
  /**
   * Get complete home page blueprint for a tenant
   */
  async getBlueprint(_tenantId: string): Promise<HomePageBlueprint | null> {
    // 1. Fetch from tenant_config for basic objects
    const configRows = await db.select().from(tenantConfig);

    const hero = configRows.find(
      (r: TenantConfig) => r.key === 'home_hero_config'
    )?.value;
    const header = configRows.find(
      (r: TenantConfig) => r.key === 'home_header_config'
    )?.value;
    const footer = configRows.find(
      (r: TenantConfig) => r.key === 'home_footer_config'
    )?.value;
    const trust = configRows.find(
      (r: TenantConfig) => r.key === 'home_trust_settings'
    )?.value;
    const discovery = configRows.find(
      (r: TenantConfig) => r.key === 'home_discovery_settings'
    )?.value;

    // 2. Fetch complex sections from their tables
    const flashCampaign = await db
      .select()
      .from(flashSales)
      .where(eq(flashSales.status, 'active'))
      .limit(1);
    let flashSalesData: any = undefined;

    if (flashCampaign[0]) {
      const products = await db
        .select()
        .from(flashSaleProducts)
        .where(eq(flashSaleProducts.flashSaleId, flashCampaign[0].id));
      flashSalesData = {
        endTime: flashCampaign[0].endTime.toISOString(),
        products: products.map((p: FlashSaleProduct) => ({
          productId: p.productId,
          discountPercentage: Number(p.discountPercentage),
          quantityLimit: p.quantityLimit,
        })),
      };
    }

    const bento = await db.select().from(bentoGrids).limit(1);

    const blueprint = {
      header: header || { navigation: [] },
      hero: hero || { slides: [] },
      flashSales: flashSalesData,
      bentoGrid: bento[0]
        ? { layoutId: bento[0].layoutId, slots: bento[0].slots as any }
        : { layoutId: 'default', slots: {} },
      trust: trust || { marqueeTexts: [], serviceIcons: [] },
      footer: footer || { contact: {} },
      discovery: discovery || { algorithm: 'best_seller', limit: 8 },
    };

    // Validate against Zod schema
    return HomePageBlueprintSchema.parse(blueprint);
  }

  /**
   * Save/Update Hero Section
   */
  async updateHero(_tenantId: string, heroData: any) {
    await db
      .insert(tenantConfig)
      .values({
        key: 'home_hero_config',
        value: heroData,
      })
      .onConflictDoUpdate({
        target: tenantConfig.key,
        set: { value: heroData, updatedAt: new Date() },
      });
  }

  /**
   * Create active Flash Sale campaign
   */
  async createFlashSale(_tenantId: string, campaign: any) {
    return await db.transaction(async (tx) => {
      const [newCampaign] = await tx
        .insert(flashSales)
        .values({
          name: campaign.name || 'Flash Sale',
          endTime: new Date(campaign.endTime),
        })
        .returning();

      if (campaign.products && campaign.products.length > 0) {
        await tx.insert(flashSaleProducts).values(
          campaign.products.map((p: any) => ({
            flashSaleId: newCampaign.id,
            productId: p.productId,
            discountPercentage: p.discountPercentage.toString(),
            quantityLimit: p.quantityLimit,
          }))
        );
      }
      return newCampaign;
    });
  }

  /**
   * Update Bento Grid layout
   */
  async updateBentoGrid(_tenantId: string, bentoData: any) {
    await db.insert(bentoGrids).values({
      name: 'Primary Home Grid',
      layoutId: bentoData.layoutId,
      slots: bentoData.slots,
    });
  }

  /**
   * Log search query for analytics
   */
  async logSearchQuery(_tenantId: string, query: string) {
    const normalizedQuery = query.toLowerCase().trim();

    await db
      .insert(searchAnalytics)
      .values({
        query: normalizedQuery,
        count: 1,
      })
      .onConflictDoUpdate({
        target: searchAnalytics.query,
        set: {
          count: sql`${searchAnalytics.count} + 1`,
          lastSearchedAt: new Date(),
        },
      });
  }

  /**
   * Get top searched terms
   */
  async getTopSearchedTerms(_tenantId: string, limit = 10) {
    return await db
      .select()
      .from(searchAnalytics)
      .orderBy(sql`${searchAnalytics.count} DESC`)
      .limit(limit);
  }
}

export const homePageService = new HomePageService();
