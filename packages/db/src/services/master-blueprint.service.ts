/**
 * Master Blueprint Service
 *
 * Unified service for managing the "Store Brain" data (PDP, Quick View, Cart, Checkout).
 */

import { type MasterBlueprint, MasterBlueprintSchema } from '@apex/validators';
import { eq } from 'drizzle-orm';
import { db } from '../connection';
import {
  type Category,
  categories,
  shippingZones,
  storeLocations,
  tenantConfig,
} from '../schema/storefront';
import { homePageService } from './home-page.service';

export class MasterBlueprintService {
  /**
   * Get the complete Master Blueprint for a tenant
   */
  async getMasterBlueprint(tenantId: string): Promise<MasterBlueprint> {
    const configRows = await db.select().from(tenantConfig);

    // Get Home Page blueprint via the dedicated service
    const home = await homePageService.getBlueprint(tenantId);

    // Get basic configs from key-value store
    const pdp = configRows.find((r) => r.key === 'pdp_config')?.value || {};
    const quickView =
      configRows.find((r) => r.key === 'quick_view_config')?.value || {};
    const cart = configRows.find((r) => r.key === 'cart_config')?.value || {};
    const checkoutConfig = configRows.find((r) => r.key === 'checkout_config')
      ?.value || { paymentMethods: ['cod'] };
    const postPurchase = configRows.find(
      (r) => r.key === 'post_purchase_config'
    )?.value || {
      orderSuccess: { showTrackButton: true },
      paymentFailure: { alternativeMethodsEnabled: true },
    };
    const compare = configRows.find((r) => r.key === 'compare_config')
      ?.value || { enabled: true };
    const locationSettings = configRows.find(
      (r) => r.key === 'location_settings'
    )?.value || { enabled: true };
    const authSettings = configRows.find((r) => r.key === 'auth_settings')
      ?.value || {
      requirePhoneOTP: true,
      otpExpiryMinutes: 5,
    };
    const accountSettings = configRows.find((r) => r.key === 'account_settings')
      ?.value || {
      loyaltyEnabled: true,
      walletEnabled: true,
    };
    const trackingSettings = configRows.find(
      (r) => r.key === 'tracking_settings'
    )?.value || {
      guestTrackingEnabled: true,
      showTimeline: true,
    };
    const loyaltySettings = configRows.find((r) => r.key === 'loyalty_settings')
      ?.value || {
      enabled: true,
      pointsName: 'Points',
    };
    const walletSettings = configRows.find((r) => r.key === 'wallet_settings')
      ?.value || {
      enabled: true,
    };
    const referralSettings = configRows.find(
      (r) => r.key === 'referral_settings'
    )?.value || {
      enabled: false,
    };
    const rmaSettings = configRows.find((r) => r.key === 'rma_settings')
      ?.value || {
      enabled: true,
    };
    const widgetSettings = configRows.find((r) => r.key === 'widget_settings')
      ?.value || {
      maintenanceMode: { enabled: false },
      newsletterPopup: { enabled: false },
      toastNotifications: { enabled: true },
    };
    const searchSettings = configRows.find((r) => r.key === 'search_settings')
      ?.value || {
      ajaxSearch: true,
      resultLimit: 5,
    };
    const navigationSettings = configRows.find(
      (r) => r.key === 'navigation_settings'
    )?.value || {
      megaMenu: { enabled: true },
      smartFilters: { enabled: true },
    };
    const trustSettings = configRows.find((r) => r.key === 'trust_settings')
      ?.value || {
      whatsappFloat: { enabled: true },
      socialWall: { enabled: false },
      cookieConsent: { enabled: true },
    };
    const aiSettings = configRows.find((r) => r.key === 'ai_settings')
      ?.value || {
      enabled: true,
      algorithm: 'last_viewed',
    };
    const giftingSettings = configRows.find((r) => r.key === 'gifting_settings')
      ?.value || {
      enabled: false,
      wrappingEnabled: true,
    };
    const interactiveSettings = configRows.find(
      (r) => r.key === 'interactive_settings'
    )?.value || {
      sizeGuideEnabled: true,
      orderTimelineStories: true,
      outOfStockNotify: true,
    };

    const legalSettings =
      configRows.find((r) => r.key === 'legal_settings')?.value || {};
    const supportSettings =
      configRows.find((r) => r.key === 'support_settings')?.value || {};
    const faqSettings =
      configRows.find((r) => r.key === 'faq_settings')?.value || {};
    const blogSettings =
      configRows.find((r) => r.key === 'blog_settings')?.value || {};
    const systemSettings =
      configRows.find((r) => r.key === 'system_settings')?.value || {};

    // Get Shipping Zones
    const zones = await db
      .select()
      .from(shippingZones)
      .where(eq(shippingZones.isActive, 1));

    // Get Store Locations
    const branches = await db.select().from(storeLocations).limit(5);

    const masterBlueprint = {
      home: home!,
      pdp: pdp,
      quickView: quickView,
      cart: cart,
      checkout: {
        ...checkoutConfig,
        shippingZones: zones.map((z) => ({
          region: z.region,
          price: Number(z.basePrice),
          estimatedDays: z.estimatedDays || undefined,
        })),
      },
      postPurchase,
      compare,
      locations: {
        ...locationSettings,
        branchLimit: branches.length,
      },
      account: accountSettings,
      auth: authSettings,
      tracking: trackingSettings,
      loyalty: loyaltySettings,
      wallet: walletSettings,
      referral: referralSettings,
      rma: rmaSettings,
      legal: legalSettings,
      support: supportSettings,
      faq: faqSettings,
      blog: blogSettings,
      system: systemSettings,
      widgets: widgetSettings,
      search: searchSettings,
      navigation: navigationSettings,
      trust: trustSettings,
      ai: aiSettings,
      gifting: giftingSettings,
      interactive: interactiveSettings,
    };

    return MasterBlueprintSchema.parse(masterBlueprint);
  }

  /**
   * Update PDP Configuration
   */
  async updatePDP(_tenantId: string, pdpData: any) {
    await db
      .insert(tenantConfig)
      .values({
        key: 'pdp_config',
        value: pdpData,
      })
      .onConflictDoUpdate({
        target: tenantConfig.key,
        set: { value: pdpData, updatedAt: new Date() },
      });
  }

  /**
   * Update Shipping Zones
   */
  async updateShippingZone(zone: any) {
    if (zone.id) {
      await db
        .update(shippingZones)
        .set(zone)
        .where(eq(shippingZones.id, zone.id));
    } else {
      await db.insert(shippingZones).values(zone);
    }
  }

  /**
   * Update Store Location
   */
  async saveLocation(location: any) {
    if (location.id) {
      await db
        .update(storeLocations)
        .set(location)
        .where(eq(storeLocations.id, location.id));
    } else {
      await db.insert(storeLocations).values(location);
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
        updatedAt: new Date() as any, // Assuming it exists, if not Drizzle handles it if defined
      })
      .where(eq(categories.id, categoryId));
  }
}

export const masterBlueprintService = new MasterBlueprintService();
