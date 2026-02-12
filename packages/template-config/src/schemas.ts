import { z } from 'zod';

/**
 * Zod schema for template.config.json
 */
export const TemplateConfigSchema = z.object({
  $schema: z.string().optional(),
  name: z.string().regex(/^[a-z0-9-]+$/, 'Template name must be kebab-case'),
  displayName: z.string().min(1).max(100),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (x.y.z)'),
  description: z.string().max(500),
  category: z.enum(['fashion', 'tech', 'food', 'general']),
  tags: z.array(z.string()).optional(),

  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),

  preview: z.object({
    image: z.string(),
    demoUrl: z.string().url().optional(),
  }),

  features: z.object({
    pages: z.object({
      // Core Shopping Flow
      home: z.boolean(),
      search: z.boolean(),
      productListing: z.boolean(),
      productDetails: z.boolean(),
      quickView: z.boolean().optional(),
      cart: z.boolean(),
      checkout: z.boolean(),
      orderSuccess: z.boolean(),
      paymentFailure: z.boolean(),

      // Personalization & Accounts
      login: z.boolean(),
      register: z.boolean(),
      account: z.boolean(),
      myOrders: z.boolean(),
      orderDetails: z.boolean(),
      trackOrderGuest: z.boolean().optional(),
      addresses: z.boolean().optional(),
      paymentMethods: z.boolean().optional(),
      wishlist: z.boolean().optional(),
      wallet: z.boolean().optional(),
      loyaltyPoints: z.boolean().optional(),
      referral: z.boolean().optional(),
      productReviews: z.boolean().optional(),
      returnRequest: z.boolean().optional(),
      notifications: z.boolean().optional(),

      // Informational & Legal
      privacyPolicy: z.boolean(),
      termsConditions: z.boolean(),
      refundPolicy: z.boolean(),
      aboutUs: z.boolean().optional(),
      contactUs: z.boolean().optional(),
      faq: z.boolean().optional(),
      blog: z.boolean().optional(),
      storeLocations: z.boolean().optional(),

      // System Pages
      error404: z.boolean(),
      maintenance: z.boolean(),
    }),
    widgets: z
      .object({
        // Search & Navigation
        globalSearchAjax: z.boolean().optional(),
        megaMenu: z.boolean().optional(),
        smartFilters: z.boolean().optional(),

        // Engagement
        toastNotifications: z.boolean().optional(),
        newsletterPopup: z.boolean().optional(),
        whatsappFloat: z.boolean().optional(),
        socialWall: z.boolean().optional(),
        outOfStockNotify: z.boolean().optional(),
        cookieConsent: z.boolean().optional(),

        // AI & Interactive
        aiPersonalizationHub: z.boolean().optional(),
        buyNowPayLater: z.boolean().optional(),
        interactiveSizeGuide: z.boolean().optional(),
        helpCenter: z.boolean().optional(),
        giftHub: z.boolean().optional(),
        orderTimelineStory: z.boolean().optional(),
      })
      .optional(),
    integrations: z
      .object({
        stripe: z.boolean().optional(),
        codPayment: z.boolean().optional(),
        googleAnalytics: z.boolean().optional(),
        facebookPixel: z.boolean().optional(),
      })
      .optional(),
  }),

  requirements: z.object({
    apexVersion: z.string(),
    node: z.string().optional(),
    packages: z.record(z.string()).optional(),
  }),

  locales: z.array(z.string()),
  rtlSupport: z.boolean(),

  customization: z
    .object({
      fonts: z.array(z.string()).optional(),
      colorSchemes: z.array(z.string()).optional(),
      layouts: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * TypeScript type inferred from TemplateConfigSchema
 */
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
