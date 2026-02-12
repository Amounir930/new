import { z } from 'zod';

/**
 * Header & Navigation Schema
 */
export const HeaderBlueprintSchema = z.object({
    logoUrl: z.string().url().optional(),
    logoAlt: z.string().min(1).max(100).optional(),
    navigation: z.array(z.object({
        id: z.string().uuid().optional(),
        label: z.string().min(1),
        url: z.string().optional(),
        icon: z.string().optional(),
        children: z.array(z.any()).optional(), // Recursive or simplified
    })),
    searchEnabled: z.boolean().default(true),
    searchDefaultText: z.string().optional(),
});

/**
 * Hero Section Schema
 */
export const HeroBlueprintSchema = z.object({
    slides: z.array(z.object({
        imageUrl: z.string().url(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        buttonText: z.string().optional(),
        buttonUrl: z.string().optional(),
    })).min(1),
    animationType: z.enum(['fade', 'slide']).default('fade'),
    displayDuration: z.number().min(1000).max(10000).default(5000),
});

/**
 * Flash Sales Schema
 */
export const FlashSalesBlueprintSchema = z.object({
    endTime: z.string().datetime(),
    products: z.array(z.object({
        productId: z.string().uuid(),
        discountPercentage: z.number().min(0).max(100),
        quantityLimit: z.number().int().min(1),
    })),
});

/**
 * Bento Grid Schema
 */
export const BentoGridBlueprintSchema = z.object({
    layoutId: z.string(), // e.g., '3-card', '5-card'
    slots: z.record(z.object({
        type: z.enum(['product', 'category', 'link']),
        referenceId: z.string().uuid().optional(),
        customImage: z.string().url().optional(),
        customText: z.string().optional(),
        link: z.string().optional(),
    })),
});

/**
 * Home Trust & News Schema
 */
export const HomeTrustBlueprintSchema = z.object({
    marqueeTexts: z.array(z.string()).min(1),
    serviceIcons: z.array(z.object({
        iconName: z.string(), // Lucide icon name
        title: z.string().min(1),
        description: z.string(),
    })).max(4),
});

/**
 * Global Footer Schema
 */
export const FooterBlueprintSchema = z.object({
    contact: z.object({
        whatsapp: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
    }),
    socialLinks: z.record(z.string().url()).optional(),
    policyLinksEnabled: z.boolean().default(true),
});

/**
 * Product Details Page (PDP) Blueprint
 */
export const PDPBlueprintSchema = z.object({
    galleryEnabled: z.boolean().default(true),
    zoomEnabled: z.boolean().default(true),
    variantsDisplay: z.enum(['dropdown', 'swatches']).default('swatches'),
    reviewsEnabled: z.boolean().default(true),
    relatedProductsLimit: z.number().int().min(0).max(12).default(4),
});

/**
 * Quick View Blueprint
 */
export const QuickViewBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    showDescription: z.boolean().default(false),
    maxImages: z.number().int().min(1).max(5).default(2),
});

/**
 * Shopping Cart Blueprint
 */
export const CartBlueprintSchema = z.object({
    minOrderAmount: z.number().min(0).default(0),
    allowCoupons: z.boolean().default(true),
    shippingEstimatorEnabled: z.boolean().default(true),
});

/**
 * Checkout Blueprint
 */
export const CheckoutBlueprintSchema = z.object({
    paymentMethods: z.array(z.enum(['cod', 'card', 'paypal', 'bank_transfer'])).min(1),
    guestCheckoutEnabled: z.boolean().default(true),
    orderNotesEnabled: z.boolean().default(true),
    shippingZones: z.array(z.object({
        region: z.string(),
        price: z.number().min(0),
        estimatedDays: z.string().optional(),
    })),
});

/**
 * Complete Home Page Blueprint
 */
export const HomePageBlueprintSchema = z.object({
    header: HeaderBlueprintSchema,
    hero: HeroBlueprintSchema,
    flashSales: FlashSalesBlueprintSchema.optional(),
    bentoGrid: BentoGridBlueprintSchema,
    trust: HomeTrustBlueprintSchema,
    footer: FooterBlueprintSchema,
    discovery: z.object({
        algorithm: z.enum(['best_seller', 'new_arrivals']).default('best_seller'),
        limit: z.number().int().min(4).max(20).default(8),
    }),
});

/**
 * Post-Purchase Blueprint
 */
export const PostPurchaseBlueprintSchema = z.object({
    orderSuccess: z.object({
        showTrackButton: z.boolean().default(true),
        customMessage: z.string().optional(),
    }),
    paymentFailure: z.object({
        alternativeMethodsEnabled: z.boolean().default(true),
        supportPhone: z.string().optional(),
    }),
});

/**
 * Compare Products Blueprint
 */
export const CompareBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    comparableAttributes: z.array(z.string()).default(['price', 'brand', 'weight']),
});

/**
 * Store Locations Blueprint
 */
export const LocationsBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    showMap: z.boolean().default(true),
    branchLimit: z.number().int().default(5),
});

/**
 * User Account & Loyalty Blueprint
 */
export const AccountBlueprintSchema = z.object({
    loyaltyEnabled: z.boolean().default(true),
    pointsPerCurrency: z.number().default(1), // e.g. 1 point per 1 USD
    walletEnabled: z.boolean().default(true),
    minRedeemPoints: z.number().int().default(100),
});

/**
 * Authentication & Security Blueprint
 */
export const AuthBlueprintSchema = z.object({
    allowGoogleLogin: z.boolean().default(false),
    allowFacebookLogin: z.boolean().default(false),
    requirePhoneOTP: z.boolean().default(true),
    otpExpiryMinutes: z.number().int().default(5),
});

/**
 * Order Tracking & Timeline Blueprint
 */
export const TrackingBlueprintSchema = z.object({
    guestTrackingEnabled: z.boolean().default(true),
    showTimeline: z.boolean().default(true),
    timelineSteps: z.array(z.string()).default(['pending', 'processing', 'shipped', 'delivered']),
});

/**
 * Loyalty & Rewards Blueprint
 */
export const LoyaltyBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    pointsName: z.string().default('Points'),
    currencyToPointsRatio: z.number().default(1),
    redeemThreshold: z.number().int().default(500),
});

/**
 * Wallet & Finances Blueprint
 */
export const WalletBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    allowTopup: z.boolean().default(false),
    cashbackPercentage: z.number().min(0).max(100).default(0),
});

/**
 * Referral & Invite Blueprint
 */
export const ReferralBlueprintSchema = z.object({
    enabled: z.boolean().default(false),
    referralRewardAmount: z.number().default(50),
    refereeRewardAmount: z.number().default(25),
});

/**
 * RMA (Returns) Blueprint
 */
export const RMABlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    returnWindowDays: z.number().int().default(14),
    requireEvidence: z.boolean().default(true),
});

/**
 * Legal & Policies Blueprint
 */
export const LegalBlueprintSchema = z.object({
    privacyPolicyId: z.string().uuid().optional(),
    termsOfServiceId: z.string().uuid().optional(),
    refundPolicyId: z.string().uuid().optional(),
    forceAcceptance: z.boolean().default(false),
});

/**
 * Support & Contact Blueprint
 */
export const SupportBlueprintSchema = z.object({
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
    }).optional(),
    workingHours: z.record(z.string(), z.string()).optional(),
});

/**
 * FAQ & Help Blueprint
 */
export const FAQBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    displayStyle: z.enum(['accordion', 'list']).default('accordion'),
});

/**
 * Blog & Content Blueprint
 */
export const BlogBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    postsPerPage: z.number().int().default(6),
    showAuthor: z.boolean().default(true),
});

/**
 * System & SEO Blueprint
 */
export const SystemBlueprintSchema = z.object({
    error404: z.object({
        message: z.string().default('Page not found'),
        suggestedLinks: z.array(z.object({
            label: z.string(),
            url: z.string(),
        })).default([{ label: 'Home', url: '/' }]),
    }),
});

/**
 * Advanced Widgets Blueprint
 */
export const WidgetsBlueprintSchema = z.object({
    maintenanceMode: z.object({
        enabled: z.boolean().default(false),
        message: z.string().default('We will be back soon!'),
    }),
    newsletterPopup: z.object({
        enabled: z.boolean().default(false),
        delaySeconds: z.number().int().default(10),
        title: z.string().default('Subscribe to our Newsletter'),
        description: z.string().default('Get the latest updates and offers.'),
    }),
    toastNotifications: z.object({
        enabled: z.boolean().default(true),
        durationMs: z.number().int().default(3000),
    }),
});

/**
 * Global Search & Discovery Blueprint
 */
export const SearchBlueprintSchema = z.object({
    ajaxSearch: z.boolean().default(true),
    resultLimit: z.number().int().default(5),
    showPrice: z.boolean().default(true),
    showCategory: z.boolean().default(true),
});

/**
 * Smart Navigation Blueprint
 */
export const NavigationBlueprintSchema = z.object({
    megaMenu: z.object({
        enabled: z.boolean().default(true),
        columns: z.number().int().default(4),
    }),
    smartFilters: z.object({
        enabled: z.boolean().default(true),
        collapsible: z.boolean().default(true),
    }),
});

/**
 * Trust & Communication Blueprint
 */
export const TrustBlueprintSchema = z.object({
    whatsappFloat: z.object({
        enabled: z.boolean().default(true),
        phone: z.string().optional(),
        message: z.string().default('Hello! I need help with...'),
    }),
    socialWall: z.object({
        enabled: z.boolean().default(false),
        provider: z.enum(['instagram', 'tiktok']).default('instagram'),
        limit: z.number().int().default(8),
    }),
    cookieConsent: z.object({
        enabled: z.boolean().default(true),
        text: z.string().optional(),
    }),
});

/**
 * AI & Personalization Blueprint
 */
export const AIPersonalizationBlueprintSchema = z.object({
    enabled: z.boolean().default(true),
    showOnHome: z.boolean().default(true),
    showOnPDP: z.boolean().default(true),
    algorithm: z.enum(['last_viewed', 'collaborative_filtering']).default('last_viewed'),
});

/**
 * Conversions & Gifting Blueprint
 */
export const GiftingBlueprintSchema = z.object({
    enabled: z.boolean().default(false),
    wrappingEnabled: z.boolean().default(true),
    customCardsEnabled: z.boolean().default(true),
    wrappingPrice: z.number().default(10),
});

/**
 * Interactive Features Blueprint (Size Guide, Stories)
 */
export const InteractiveBlueprintSchema = z.object({
    sizeGuideEnabled: z.boolean().default(true),
    orderTimelineStories: z.boolean().default(true),
    outOfStockNotify: z.boolean().default(true),
});

/**
 * Master Blueprint - The "Brain" of the Store
 */
export const MasterBlueprintSchema = z.object({
    home: HomePageBlueprintSchema,
    pdp: PDPBlueprintSchema,
    quickView: QuickViewBlueprintSchema,
    cart: CartBlueprintSchema,
    checkout: CheckoutBlueprintSchema,
    postPurchase: PostPurchaseBlueprintSchema,
    compare: CompareBlueprintSchema,
    locations: LocationsBlueprintSchema,
    account: AccountBlueprintSchema,
    auth: AuthBlueprintSchema,
    tracking: TrackingBlueprintSchema,
    loyalty: LoyaltyBlueprintSchema,
    wallet: WalletBlueprintSchema,
    referral: ReferralBlueprintSchema,
    rma: RMABlueprintSchema,
    legal: LegalBlueprintSchema,
    support: SupportBlueprintSchema,
    faq: FAQBlueprintSchema,
    blog: BlogBlueprintSchema,
    system: SystemBlueprintSchema,
    widgets: WidgetsBlueprintSchema,
    search: SearchBlueprintSchema,
    navigation: NavigationBlueprintSchema,
    trust: TrustBlueprintSchema,
    ai: AIPersonalizationBlueprintSchema,
    gifting: GiftingBlueprintSchema,
    interactive: InteractiveBlueprintSchema,
});

export type HomePageBlueprint = z.infer<typeof HomePageBlueprintSchema>;
export type MasterBlueprint = z.infer<typeof MasterBlueprintSchema>;
