/**
 * Master Blueprint Service
 *
 * Unified service for managing the "Store Brain" data (PDP, Quick View, Cart, Checkout).
 */

import { type MasterBlueprint, MasterBlueprintSchema } from '@apex/validators';
import { eq } from 'drizzle-orm';
import { db } from '../connection.js';
import {
  type Category,
  categories,
  shippingMethods,
  shippingZones,
  storeLocations,
  tenantConfig,
} from '../schema/storefront/index.js';
import { homePageService } from './home-page.service.js';

// ---------------------------------------------------------------------------
// Input types for update methods
// ---------------------------------------------------------------------------

/** PDP section configuration payload */
export type PdpConfigInput = Record<string, unknown>;

/** Shipping zone upsert payload */
export interface ShippingZoneInput {
  id?: string;
  name: string;
  isActive?: boolean;
  [key: string]: unknown;
}

/** Store location upsert payload */
export interface StoreLocationInput {
  id?: string;
  name: string;
  tenantId: string;
  code: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  [key: string]: unknown;
}

export class MasterBlueprintService {
  /**
   * Get the complete Master Blueprint for a tenant
   */
  async getMasterBlueprint(tenantId: string): Promise<MasterBlueprint> {
    const configRows = await db.select().from(tenantConfig);

    // Get Home Page blueprint via the dedicated service
    const home = await homePageService.getBlueprint(tenantId);

    // Helper to fetch config or use default
    const getConfig = (key: string, defaultVal: unknown): unknown =>
      configRows.find((r) => r.key === key)?.value || defaultVal;

    // Get Shipping Zones & Methods (Joined)
    const zones = await db
      .select({
        region: shippingZones.name,
        price: shippingMethods.basePrice,
        estimatedDays: shippingMethods.estimatedDays,
      })
      .from(shippingZones)
      .innerJoin(shippingMethods, eq(shippingMethods.zoneId, shippingZones.id))
      .where(eq(shippingZones.isActive, true));

    // Get Store Locations
    const branches = await db.select().from(storeLocations).limit(5);

    const masterBlueprint = {
      home: home!,
      pdp: getConfig('pdp_config', {}),
      quickView: getConfig('quick_view_config', {}),
      cart: getConfig('cart_config', {}),
      checkout: {
        ...(getConfig('checkout_config', { paymentMethods: ['cod'] }) as Record<
          string,
          unknown
        >),
        shippingZones: zones.map((z) => ({
          region: z.region,
          price: Number((z.price as unknown as { amount: bigint }).amount ?? 0),
          estimatedDays: z.estimatedDays || undefined,
        })),
      },
      postPurchase: getConfig('post_purchase_config', {
        orderSuccess: { showTrackButton: true },
        paymentFailure: { alternativeMethodsEnabled: true },
      }),
      compare: getConfig('compare_config', { enabled: true }),
      locations: {
        ...(getConfig('location_settings', { enabled: true }) as Record<
          string,
          unknown
        >),
        branchLimit: branches.length,
      },
      account: getConfig('account_settings', {
        loyaltyEnabled: true,
        walletEnabled: true,
      }),
      auth: getConfig('auth_settings', {
        requirePhoneOTP: true,
        otpExpiryMinutes: 5,
      }),
      tracking: getConfig('tracking_settings', {
        guestTrackingEnabled: true,
        showTimeline: true,
      }),
      loyalty: getConfig('loyalty_settings', {
        enabled: true,
        pointsName: 'Points',
      }),
      wallet: getConfig('wallet_settings', { enabled: true }),
      referral: getConfig('referral_settings', { enabled: false }),
      rma: getConfig('rma_settings', { enabled: true }),
      legal: getConfig('legal_settings', {}),
      support: getConfig('support_settings', {}),
      faq: getConfig('faq_settings', {}),
      blog: getConfig('blog_settings', {}),
      system: getConfig('system_settings', {}),
      widgets: getConfig('widget_settings', {
        maintenanceMode: { enabled: false },
        newsletterPopup: { enabled: false },
        toastNotifications: { enabled: true },
      }),
      search: getConfig('search_settings', {
        ajaxSearch: true,
        resultLimit: 5,
      }),
      navigation: getConfig('navigation_settings', {
        megaMenu: { enabled: true },
        smartFilters: { enabled: true },
      }),
      trust: getConfig('trust_settings', {
        whatsappFloat: { enabled: true },
        socialWall: { enabled: false },
        cookieConsent: { enabled: true },
      }),
      ai: getConfig('ai_settings', {
        enabled: true,
        algorithm: 'last_viewed',
      }),
      gifting: getConfig('gifting_settings', {
        enabled: false,
        wrappingEnabled: true,
      }),
      interactive: getConfig('interactive_settings', {
        sizeGuideEnabled: true,
        orderTimelineStories: true,
        outOfStockNotify: true,
      }),
    };

    return MasterBlueprintSchema.parse(masterBlueprint);
  }

  /**
   * Update PDP Configuration
   */
  async updatePDP(_tenantId: string, pdpData: PdpConfigInput) {
    await db
      .insert(tenantConfig)
      .values({
        key: 'pdp_config',
        value: pdpData,
      })
      .onConflictDoUpdate({
        target: tenantConfig.key,
        set: { value: pdpData },
      });
  }

  /**
   * Update Shipping Zones
   */
  async updateShippingZone(zone: ShippingZoneInput) {
    const data = {
      name: zone.name,
      isActive: zone.isActive,
    };

    if (zone.id) {
      await db
        .update(shippingZones)
        .set(data)
        .where(eq(shippingZones.id, zone.id));
    } else {
      await db.insert(shippingZones).values({
        ...data,
        tenantId: zone.tenantId as string, // Ensure tenantId from input or context
        countryCode: zone.countryCode as string,
      });
    }
  }

  /**
   * Update Store Location
   */
  async saveLocation(location: StoreLocationInput) {
    const data = {
      name: location.name,
      code: location.code,
      address: location.address,
      isActive: location.isActive as boolean | undefined,
      coordinates:
        location.lat !== undefined && location.lng !== undefined
          ? { lat: location.lat as number, lng: location.lng as number }
          : undefined,
    };

    if (location.id) {
      await db
        .update(storeLocations)
        .set(data)
        .where(eq(storeLocations.id, location.id));
    } else {
      await db.insert(storeLocations).values({
        ...data,
        tenantId: location.tenantId,
      });
    }
  }

  /**
   * Update Category Blueprint (SEO & Banner)
   */
  async updateCategoryBlueprint(categoryId: string, data: Partial<Category>) {
    await db
      .update(categories)
      .set({
        bannerUrl: data.bannerUrl,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      })
      .where(eq(categories.id, categoryId));
  }
}

export const masterBlueprintService = new MasterBlueprintService();
