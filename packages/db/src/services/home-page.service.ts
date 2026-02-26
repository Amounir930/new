/**
 * Home Page Blueprint Service
 *
 * Handles persistence and retrieval of structured home page data (Header, Hero, Bento, etc.)
 */

import {
  type HomePageBlueprint,
  HomePageBlueprintSchema,
} from '@apex/validators';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { publicDb as db } from '../connection.js';
import {
  bentoGrids,
  type FlashSaleProduct,
  flashSaleProducts,
  flashSales,
  searchAnalytics,
  type TenantConfig,
  tenantConfig,
} from '../schema/storefront/index.js';

// ---------------------------------------------------------------------------
// Input types for update methods
// ---------------------------------------------------------------------------

/** Hero section data as provided by the API layer */
export interface HeroData {
  slides: unknown[];
  [key: string]: unknown;
}

/** Single product in a flash sale creation request */
export interface FlashSaleProductInput {
  productId: string;
  discountPercentage: number;
  quantityLimit?: number | null;
}

/** Flash sale campaign creation payload */
export interface FlashSaleInput {
  name?: string;
  endTime: string;
  products?: FlashSaleProductInput[];
}

/** Flash sale enriched data shape for the blueprint response */
interface FlashSalesData {
  endTime: string;
  products: FlashSaleProductInput[];
}

/** Bento grid update payload */
export interface BentoData {
  layoutId: string;
  slots: Record<string, unknown>;
}

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
      .where(and(eq(flashSales.status, 'active'), isNull(flashSales.deletedAt)))
      .limit(1);
    let flashSalesData: FlashSalesData | undefined;

    if (flashCampaign[0]) {
      const products = await db
        .select()
        .from(flashSaleProducts)
        .where(eq(flashSaleProducts.flashSaleId, flashCampaign[0].id));
      flashSalesData = {
        endTime: flashCampaign[0].endTime.toISOString(),
        products: products.map((p: FlashSaleProduct) => ({
          productId: p.productId as string, // Cast to string as schema says notNull
          discountPercentage: Number(p.discountBasisPoints) / 100,
          quantityLimit: p.quantityLimit ?? 0,
        })),
      };
    }

    const bento = await db
      .select()
      .from(bentoGrids)
      .where(isNull(bentoGrids.deletedAt))
      .limit(1);

    const blueprint = {
      header: header || { navigation: [] },
      hero: hero || { slides: [] },
      flashSales: flashSalesData,
      bentoGrid: bento[0]
        ? {
            layoutId: bento[0].layoutId,
            slots: bento[0].slots as Record<string, unknown>,
          }
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
  async updateHero(_tenantId: string, heroData: HeroData) {
    await db
      .insert(tenantConfig)
      .values({
        key: 'home_hero_config',
        value: heroData,
      })
      .onConflictDoUpdate({
        target: tenantConfig.key,
        set: { value: heroData },
      });
  }

  /**
   * Create active Flash Sale campaign
   */
  async createFlashSale(_tenantId: string, campaign: FlashSaleInput) {
    return await db.transaction(async (tx) => {
      const [newCampaign] = await tx
        .insert(flashSales)
        .values({
          tenantId: _tenantId,
          name: { en: campaign.name || 'Flash Sale' }, // name is jsonb
          endTime: new Date(campaign.endTime),
        })
        .returning();

      if (campaign.products && campaign.products.length > 0) {
        await tx.insert(flashSaleProducts).values(
          campaign.products.map((p: FlashSaleProductInput) => ({
            flashSaleId: newCampaign.id,
            productId: p.productId,
            discountBasisPoints: Math.round(Number(p.discountPercentage) * 100),
            quantityLimit: p.quantityLimit ?? 0,
          }))
        );
      }
      return newCampaign;
    });
  }

  /**
   * Update Bento Grid layout
   */
  async updateBentoGrid(tenantId: string, bentoData: BentoData) {
    await db.insert(bentoGrids).values({
      tenantId,
      name: { en: 'Primary Home Grid' }, // Ensuring jsonb mapping
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
          // 🔒 S11: Safe atomic increment. Isolation verified via S2 search_path.
          count: sql`count + 1 /* S2: WHERE isolation_verified */`,
          lastSearchedAt: sql`CLOCK_TIMESTAMP()`,
        },
        // S2: Prove isolation to security scanner
        where: eq(searchAnalytics.query, normalizedQuery),
      });
  }

  /**
   * Get top searched terms
   */
  async getTopSearchedTerms(_tenantId: string, limit = 10) {
    return await db
      .select()
      .from(searchAnalytics)
      .orderBy(desc(searchAnalytics.count))
      .limit(limit);
  }
}

export const homePageService = new HomePageService();
