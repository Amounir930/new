import { z } from 'zod';
/**
 * Header & Navigation Schema
 */
export declare const HeaderBlueprintSchema: z.ZodObject<{
    logoUrl: z.ZodOptional<z.ZodString>;
    logoAlt: z.ZodOptional<z.ZodString>;
    navigation: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        label: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        children: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        id?: string | undefined;
        url?: string | undefined;
        icon?: string | undefined;
        children?: any[] | undefined;
    }, {
        label: string;
        id?: string | undefined;
        url?: string | undefined;
        icon?: string | undefined;
        children?: any[] | undefined;
    }>, "many">;
    searchEnabled: z.ZodDefault<z.ZodBoolean>;
    searchDefaultText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    navigation: {
        label: string;
        id?: string | undefined;
        url?: string | undefined;
        icon?: string | undefined;
        children?: any[] | undefined;
    }[];
    searchEnabled: boolean;
    logoUrl?: string | undefined;
    logoAlt?: string | undefined;
    searchDefaultText?: string | undefined;
}, {
    navigation: {
        label: string;
        id?: string | undefined;
        url?: string | undefined;
        icon?: string | undefined;
        children?: any[] | undefined;
    }[];
    logoUrl?: string | undefined;
    logoAlt?: string | undefined;
    searchEnabled?: boolean | undefined;
    searchDefaultText?: string | undefined;
}>;
/**
 * Hero Section Schema
 */
export declare const HeroBlueprintSchema: z.ZodObject<{
    slides: z.ZodArray<z.ZodObject<{
        imageUrl: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        buttonText: z.ZodOptional<z.ZodString>;
        buttonUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        buttonText?: string | undefined;
        buttonUrl?: string | undefined;
    }, {
        imageUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        buttonText?: string | undefined;
        buttonUrl?: string | undefined;
    }>, "many">;
    animationType: z.ZodDefault<z.ZodEnum<["fade", "slide"]>>;
    displayDuration: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    slides: {
        imageUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        buttonText?: string | undefined;
        buttonUrl?: string | undefined;
    }[];
    animationType: "fade" | "slide";
    displayDuration: number;
}, {
    slides: {
        imageUrl: string;
        title?: string | undefined;
        subtitle?: string | undefined;
        buttonText?: string | undefined;
        buttonUrl?: string | undefined;
    }[];
    animationType?: "fade" | "slide" | undefined;
    displayDuration?: number | undefined;
}>;
/**
 * Flash Sales Schema
 */
export declare const FlashSalesBlueprintSchema: z.ZodObject<{
    endTime: z.ZodString;
    products: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        discountPercentage: z.ZodNumber;
        quantityLimit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        discountPercentage: number;
        quantityLimit: number;
    }, {
        productId: string;
        discountPercentage: number;
        quantityLimit: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    products: {
        productId: string;
        discountPercentage: number;
        quantityLimit: number;
    }[];
    endTime: string;
}, {
    products: {
        productId: string;
        discountPercentage: number;
        quantityLimit: number;
    }[];
    endTime: string;
}>;
/**
 * Bento Grid Schema
 */
export declare const BentoGridBlueprintSchema: z.ZodObject<{
    layoutId: z.ZodString;
    slots: z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodEnum<["product", "category", "link"]>;
        referenceId: z.ZodOptional<z.ZodString>;
        customImage: z.ZodOptional<z.ZodString>;
        customText: z.ZodOptional<z.ZodString>;
        link: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "link" | "product" | "category";
        link?: string | undefined;
        referenceId?: string | undefined;
        customImage?: string | undefined;
        customText?: string | undefined;
    }, {
        type: "link" | "product" | "category";
        link?: string | undefined;
        referenceId?: string | undefined;
        customImage?: string | undefined;
        customText?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    layoutId: string;
    slots: Record<string, {
        type: "link" | "product" | "category";
        link?: string | undefined;
        referenceId?: string | undefined;
        customImage?: string | undefined;
        customText?: string | undefined;
    }>;
}, {
    layoutId: string;
    slots: Record<string, {
        type: "link" | "product" | "category";
        link?: string | undefined;
        referenceId?: string | undefined;
        customImage?: string | undefined;
        customText?: string | undefined;
    }>;
}>;
/**
 * Home Trust & News Schema
 */
export declare const HomeTrustBlueprintSchema: z.ZodObject<{
    marqueeTexts: z.ZodArray<z.ZodString, "many">;
    serviceIcons: z.ZodArray<z.ZodObject<{
        iconName: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        iconName: string;
    }, {
        description: string;
        title: string;
        iconName: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    marqueeTexts: string[];
    serviceIcons: {
        description: string;
        title: string;
        iconName: string;
    }[];
}, {
    marqueeTexts: string[];
    serviceIcons: {
        description: string;
        title: string;
        iconName: string;
    }[];
}>;
/**
 * Global Footer Schema
 */
export declare const FooterBlueprintSchema: z.ZodObject<{
    contact: z.ZodObject<{
        whatsapp: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        whatsapp?: string | undefined;
        address?: string | undefined;
    }, {
        email?: string | undefined;
        whatsapp?: string | undefined;
        address?: string | undefined;
    }>;
    socialLinks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    policyLinksEnabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    contact: {
        email?: string | undefined;
        whatsapp?: string | undefined;
        address?: string | undefined;
    };
    policyLinksEnabled: boolean;
    socialLinks?: Record<string, string> | undefined;
}, {
    contact: {
        email?: string | undefined;
        whatsapp?: string | undefined;
        address?: string | undefined;
    };
    socialLinks?: Record<string, string> | undefined;
    policyLinksEnabled?: boolean | undefined;
}>;
/**
 * Product Details Page (PDP) Blueprint
 */
export declare const PDPBlueprintSchema: z.ZodObject<{
    galleryEnabled: z.ZodDefault<z.ZodBoolean>;
    zoomEnabled: z.ZodDefault<z.ZodBoolean>;
    variantsDisplay: z.ZodDefault<z.ZodEnum<["dropdown", "swatches"]>>;
    reviewsEnabled: z.ZodDefault<z.ZodBoolean>;
    relatedProductsLimit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    galleryEnabled: boolean;
    zoomEnabled: boolean;
    variantsDisplay: "dropdown" | "swatches";
    reviewsEnabled: boolean;
    relatedProductsLimit: number;
}, {
    galleryEnabled?: boolean | undefined;
    zoomEnabled?: boolean | undefined;
    variantsDisplay?: "dropdown" | "swatches" | undefined;
    reviewsEnabled?: boolean | undefined;
    relatedProductsLimit?: number | undefined;
}>;
/**
 * Quick View Blueprint
 */
export declare const QuickViewBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    showDescription: z.ZodDefault<z.ZodBoolean>;
    maxImages: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    showDescription: boolean;
    maxImages: number;
}, {
    enabled?: boolean | undefined;
    showDescription?: boolean | undefined;
    maxImages?: number | undefined;
}>;
/**
 * Shopping Cart Blueprint
 */
export declare const CartBlueprintSchema: z.ZodObject<{
    minOrderAmount: z.ZodDefault<z.ZodNumber>;
    allowCoupons: z.ZodDefault<z.ZodBoolean>;
    shippingEstimatorEnabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    minOrderAmount: number;
    allowCoupons: boolean;
    shippingEstimatorEnabled: boolean;
}, {
    minOrderAmount?: number | undefined;
    allowCoupons?: boolean | undefined;
    shippingEstimatorEnabled?: boolean | undefined;
}>;
/**
 * Checkout Blueprint
 */
export declare const CheckoutBlueprintSchema: z.ZodObject<{
    paymentMethods: z.ZodArray<z.ZodEnum<["cod", "card", "paypal", "bank_transfer"]>, "many">;
    guestCheckoutEnabled: z.ZodDefault<z.ZodBoolean>;
    orderNotesEnabled: z.ZodDefault<z.ZodBoolean>;
    shippingZones: z.ZodArray<z.ZodObject<{
        region: z.ZodString;
        price: z.ZodNumber;
        estimatedDays: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        price: number;
        region: string;
        estimatedDays?: string | undefined;
    }, {
        price: number;
        region: string;
        estimatedDays?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    paymentMethods: ("cod" | "card" | "paypal" | "bank_transfer")[];
    guestCheckoutEnabled: boolean;
    orderNotesEnabled: boolean;
    shippingZones: {
        price: number;
        region: string;
        estimatedDays?: string | undefined;
    }[];
}, {
    paymentMethods: ("cod" | "card" | "paypal" | "bank_transfer")[];
    shippingZones: {
        price: number;
        region: string;
        estimatedDays?: string | undefined;
    }[];
    guestCheckoutEnabled?: boolean | undefined;
    orderNotesEnabled?: boolean | undefined;
}>;
/**
 * Complete Home Page Blueprint
 */
export declare const HomePageBlueprintSchema: z.ZodObject<{
    header: z.ZodObject<{
        logoUrl: z.ZodOptional<z.ZodString>;
        logoAlt: z.ZodOptional<z.ZodString>;
        navigation: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            label: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
            children: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        }, "strip", z.ZodTypeAny, {
            label: string;
            id?: string | undefined;
            url?: string | undefined;
            icon?: string | undefined;
            children?: any[] | undefined;
        }, {
            label: string;
            id?: string | undefined;
            url?: string | undefined;
            icon?: string | undefined;
            children?: any[] | undefined;
        }>, "many">;
        searchEnabled: z.ZodDefault<z.ZodBoolean>;
        searchDefaultText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        navigation: {
            label: string;
            id?: string | undefined;
            url?: string | undefined;
            icon?: string | undefined;
            children?: any[] | undefined;
        }[];
        searchEnabled: boolean;
        logoUrl?: string | undefined;
        logoAlt?: string | undefined;
        searchDefaultText?: string | undefined;
    }, {
        navigation: {
            label: string;
            id?: string | undefined;
            url?: string | undefined;
            icon?: string | undefined;
            children?: any[] | undefined;
        }[];
        logoUrl?: string | undefined;
        logoAlt?: string | undefined;
        searchEnabled?: boolean | undefined;
        searchDefaultText?: string | undefined;
    }>;
    hero: z.ZodObject<{
        slides: z.ZodArray<z.ZodObject<{
            imageUrl: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            subtitle: z.ZodOptional<z.ZodString>;
            buttonText: z.ZodOptional<z.ZodString>;
            buttonUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            imageUrl: string;
            title?: string | undefined;
            subtitle?: string | undefined;
            buttonText?: string | undefined;
            buttonUrl?: string | undefined;
        }, {
            imageUrl: string;
            title?: string | undefined;
            subtitle?: string | undefined;
            buttonText?: string | undefined;
            buttonUrl?: string | undefined;
        }>, "many">;
        animationType: z.ZodDefault<z.ZodEnum<["fade", "slide"]>>;
        displayDuration: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        slides: {
            imageUrl: string;
            title?: string | undefined;
            subtitle?: string | undefined;
            buttonText?: string | undefined;
            buttonUrl?: string | undefined;
        }[];
        animationType: "fade" | "slide";
        displayDuration: number;
    }, {
        slides: {
            imageUrl: string;
            title?: string | undefined;
            subtitle?: string | undefined;
            buttonText?: string | undefined;
            buttonUrl?: string | undefined;
        }[];
        animationType?: "fade" | "slide" | undefined;
        displayDuration?: number | undefined;
    }>;
    flashSales: z.ZodOptional<z.ZodObject<{
        endTime: z.ZodString;
        products: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            discountPercentage: z.ZodNumber;
            quantityLimit: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            productId: string;
            discountPercentage: number;
            quantityLimit: number;
        }, {
            productId: string;
            discountPercentage: number;
            quantityLimit: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        products: {
            productId: string;
            discountPercentage: number;
            quantityLimit: number;
        }[];
        endTime: string;
    }, {
        products: {
            productId: string;
            discountPercentage: number;
            quantityLimit: number;
        }[];
        endTime: string;
    }>>;
    bentoGrid: z.ZodObject<{
        layoutId: z.ZodString;
        slots: z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodEnum<["product", "category", "link"]>;
            referenceId: z.ZodOptional<z.ZodString>;
            customImage: z.ZodOptional<z.ZodString>;
            customText: z.ZodOptional<z.ZodString>;
            link: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "link" | "product" | "category";
            link?: string | undefined;
            referenceId?: string | undefined;
            customImage?: string | undefined;
            customText?: string | undefined;
        }, {
            type: "link" | "product" | "category";
            link?: string | undefined;
            referenceId?: string | undefined;
            customImage?: string | undefined;
            customText?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        layoutId: string;
        slots: Record<string, {
            type: "link" | "product" | "category";
            link?: string | undefined;
            referenceId?: string | undefined;
            customImage?: string | undefined;
            customText?: string | undefined;
        }>;
    }, {
        layoutId: string;
        slots: Record<string, {
            type: "link" | "product" | "category";
            link?: string | undefined;
            referenceId?: string | undefined;
            customImage?: string | undefined;
            customText?: string | undefined;
        }>;
    }>;
    trust: z.ZodObject<{
        marqueeTexts: z.ZodArray<z.ZodString, "many">;
        serviceIcons: z.ZodArray<z.ZodObject<{
            iconName: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            title: string;
            iconName: string;
        }, {
            description: string;
            title: string;
            iconName: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        marqueeTexts: string[];
        serviceIcons: {
            description: string;
            title: string;
            iconName: string;
        }[];
    }, {
        marqueeTexts: string[];
        serviceIcons: {
            description: string;
            title: string;
            iconName: string;
        }[];
    }>;
    footer: z.ZodObject<{
        contact: z.ZodObject<{
            whatsapp: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email?: string | undefined;
            whatsapp?: string | undefined;
            address?: string | undefined;
        }, {
            email?: string | undefined;
            whatsapp?: string | undefined;
            address?: string | undefined;
        }>;
        socialLinks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        policyLinksEnabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        contact: {
            email?: string | undefined;
            whatsapp?: string | undefined;
            address?: string | undefined;
        };
        policyLinksEnabled: boolean;
        socialLinks?: Record<string, string> | undefined;
    }, {
        contact: {
            email?: string | undefined;
            whatsapp?: string | undefined;
            address?: string | undefined;
        };
        socialLinks?: Record<string, string> | undefined;
        policyLinksEnabled?: boolean | undefined;
    }>;
    discovery: z.ZodObject<{
        algorithm: z.ZodDefault<z.ZodEnum<["best_seller", "new_arrivals"]>>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        algorithm: "best_seller" | "new_arrivals";
    }, {
        limit?: number | undefined;
        algorithm?: "best_seller" | "new_arrivals" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    header: {
        navigation: {
            label: string;
            id?: string | undefined;
            url?: string | undefined;
            icon?: string | undefined;
            children?: any[] | undefined;
        }[];
        searchEnabled: boolean;
        logoUrl?: string | undefined;
        logoAlt?: string | undefined;
        searchDefaultText?: string | undefined;
    };
    hero: {
        slides: {
            imageUrl: string;
            title?: string | undefined;
            subtitle?: string | undefined;
            buttonText?: string | undefined;
            buttonUrl?: string | undefined;
        }[];
        animationType: "fade" | "slide";
        displayDuration: number;
    };
    bentoGrid: {
        layoutId: string;
        slots: Record<string, {
            type: "link" | "product" | "category";
            link?: string | undefined;
            referenceId?: string | undefined;
            customImage?: string | undefined;
            customText?: string | undefined;
        }>;
    };
    trust: {
        marqueeTexts: string[];
        serviceIcons: {
            description: string;
            title: string;
            iconName: string;
        }[];
    };
    footer: {
        contact: {
            email?: string | undefined;
            whatsapp?: string | undefined;
            address?: string | undefined;
        };
        policyLinksEnabled: boolean;
        socialLinks?: Record<string, string> | undefined;
    };
    discovery: {
        limit: number;
        algorithm: "best_seller" | "new_arrivals";
    };
    flashSales?: {
        products: {
            productId: string;
            discountPercentage: number;
            quantityLimit: number;
        }[];
        endTime: string;
    } | undefined;
}, {
    header: {
        navigation: {
            label: string;
            id?: string | undefined;
            url?: string | undefined;
            icon?: string | undefined;
            children?: any[] | undefined;
        }[];
        logoUrl?: string | undefined;
        logoAlt?: string | undefined;
        searchEnabled?: boolean | undefined;
        searchDefaultText?: string | undefined;
    };
    hero: {
        slides: {
            imageUrl: string;
            title?: string | undefined;
            subtitle?: string | undefined;
            buttonText?: string | undefined;
            buttonUrl?: string | undefined;
        }[];
        animationType?: "fade" | "slide" | undefined;
        displayDuration?: number | undefined;
    };
    bentoGrid: {
        layoutId: string;
        slots: Record<string, {
            type: "link" | "product" | "category";
            link?: string | undefined;
            referenceId?: string | undefined;
            customImage?: string | undefined;
            customText?: string | undefined;
        }>;
    };
    trust: {
        marqueeTexts: string[];
        serviceIcons: {
            description: string;
            title: string;
            iconName: string;
        }[];
    };
    footer: {
        contact: {
            email?: string | undefined;
            whatsapp?: string | undefined;
            address?: string | undefined;
        };
        socialLinks?: Record<string, string> | undefined;
        policyLinksEnabled?: boolean | undefined;
    };
    discovery: {
        limit?: number | undefined;
        algorithm?: "best_seller" | "new_arrivals" | undefined;
    };
    flashSales?: {
        products: {
            productId: string;
            discountPercentage: number;
            quantityLimit: number;
        }[];
        endTime: string;
    } | undefined;
}>;
/**
 * Post-Purchase Blueprint
 */
export declare const PostPurchaseBlueprintSchema: z.ZodObject<{
    orderSuccess: z.ZodObject<{
        showTrackButton: z.ZodDefault<z.ZodBoolean>;
        customMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        showTrackButton: boolean;
        customMessage?: string | undefined;
    }, {
        showTrackButton?: boolean | undefined;
        customMessage?: string | undefined;
    }>;
    paymentFailure: z.ZodObject<{
        alternativeMethodsEnabled: z.ZodDefault<z.ZodBoolean>;
        supportPhone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        alternativeMethodsEnabled: boolean;
        supportPhone?: string | undefined;
    }, {
        alternativeMethodsEnabled?: boolean | undefined;
        supportPhone?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    orderSuccess: {
        showTrackButton: boolean;
        customMessage?: string | undefined;
    };
    paymentFailure: {
        alternativeMethodsEnabled: boolean;
        supportPhone?: string | undefined;
    };
}, {
    orderSuccess: {
        showTrackButton?: boolean | undefined;
        customMessage?: string | undefined;
    };
    paymentFailure: {
        alternativeMethodsEnabled?: boolean | undefined;
        supportPhone?: string | undefined;
    };
}>;
/**
 * Compare Products Blueprint
 */
export declare const CompareBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    comparableAttributes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    comparableAttributes: string[];
}, {
    enabled?: boolean | undefined;
    comparableAttributes?: string[] | undefined;
}>;
/**
 * Store Locations Blueprint
 */
export declare const LocationsBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    showMap: z.ZodDefault<z.ZodBoolean>;
    branchLimit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    showMap: boolean;
    branchLimit: number;
}, {
    enabled?: boolean | undefined;
    showMap?: boolean | undefined;
    branchLimit?: number | undefined;
}>;
/**
 * User Account & Loyalty Blueprint
 */
export declare const AccountBlueprintSchema: z.ZodObject<{
    loyaltyEnabled: z.ZodDefault<z.ZodBoolean>;
    pointsPerCurrency: z.ZodDefault<z.ZodNumber>;
    walletEnabled: z.ZodDefault<z.ZodBoolean>;
    minRedeemPoints: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    loyaltyEnabled: boolean;
    pointsPerCurrency: number;
    walletEnabled: boolean;
    minRedeemPoints: number;
}, {
    loyaltyEnabled?: boolean | undefined;
    pointsPerCurrency?: number | undefined;
    walletEnabled?: boolean | undefined;
    minRedeemPoints?: number | undefined;
}>;
/**
 * Authentication & Security Blueprint
 */
export declare const AuthBlueprintSchema: z.ZodObject<{
    allowGoogleLogin: z.ZodDefault<z.ZodBoolean>;
    allowFacebookLogin: z.ZodDefault<z.ZodBoolean>;
    requirePhoneOTP: z.ZodDefault<z.ZodBoolean>;
    otpExpiryMinutes: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    allowGoogleLogin: boolean;
    allowFacebookLogin: boolean;
    requirePhoneOTP: boolean;
    otpExpiryMinutes: number;
}, {
    allowGoogleLogin?: boolean | undefined;
    allowFacebookLogin?: boolean | undefined;
    requirePhoneOTP?: boolean | undefined;
    otpExpiryMinutes?: number | undefined;
}>;
/**
 * Order Tracking & Timeline Blueprint
 */
export declare const TrackingBlueprintSchema: z.ZodObject<{
    guestTrackingEnabled: z.ZodDefault<z.ZodBoolean>;
    showTimeline: z.ZodDefault<z.ZodBoolean>;
    timelineSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    guestTrackingEnabled: boolean;
    showTimeline: boolean;
    timelineSteps: string[];
}, {
    guestTrackingEnabled?: boolean | undefined;
    showTimeline?: boolean | undefined;
    timelineSteps?: string[] | undefined;
}>;
/**
 * Loyalty & Rewards Blueprint
 */
export declare const LoyaltyBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    pointsName: z.ZodDefault<z.ZodString>;
    currencyToPointsRatio: z.ZodDefault<z.ZodNumber>;
    redeemThreshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    pointsName: string;
    currencyToPointsRatio: number;
    redeemThreshold: number;
}, {
    enabled?: boolean | undefined;
    pointsName?: string | undefined;
    currencyToPointsRatio?: number | undefined;
    redeemThreshold?: number | undefined;
}>;
/**
 * Wallet & Finances Blueprint
 */
export declare const WalletBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    allowTopup: z.ZodDefault<z.ZodBoolean>;
    cashbackPercentage: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    allowTopup: boolean;
    cashbackPercentage: number;
}, {
    enabled?: boolean | undefined;
    allowTopup?: boolean | undefined;
    cashbackPercentage?: number | undefined;
}>;
/**
 * Referral & Invite Blueprint
 */
export declare const ReferralBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    referralRewardAmount: z.ZodDefault<z.ZodNumber>;
    refereeRewardAmount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    referralRewardAmount: number;
    refereeRewardAmount: number;
}, {
    enabled?: boolean | undefined;
    referralRewardAmount?: number | undefined;
    refereeRewardAmount?: number | undefined;
}>;
/**
 * RMA (Returns) Blueprint
 */
export declare const RMABlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    returnWindowDays: z.ZodDefault<z.ZodNumber>;
    requireEvidence: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    returnWindowDays: number;
    requireEvidence: boolean;
}, {
    enabled?: boolean | undefined;
    returnWindowDays?: number | undefined;
    requireEvidence?: boolean | undefined;
}>;
/**
 * Legal & Policies Blueprint
 */
export declare const LegalBlueprintSchema: z.ZodObject<{
    privacyPolicyId: z.ZodOptional<z.ZodString>;
    termsOfServiceId: z.ZodOptional<z.ZodString>;
    refundPolicyId: z.ZodOptional<z.ZodString>;
    forceAcceptance: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    forceAcceptance: boolean;
    privacyPolicyId?: string | undefined;
    termsOfServiceId?: string | undefined;
    refundPolicyId?: string | undefined;
}, {
    privacyPolicyId?: string | undefined;
    termsOfServiceId?: string | undefined;
    refundPolicyId?: string | undefined;
    forceAcceptance?: boolean | undefined;
}>;
/**
 * Support & Contact Blueprint
 */
export declare const SupportBlueprintSchema: z.ZodObject<{
    contactEmail: z.ZodOptional<z.ZodString>;
    contactPhone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>;
    workingHours: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    address?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    workingHours?: Record<string, string> | undefined;
}, {
    address?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
    coordinates?: {
        lat: number;
        lng: number;
    } | undefined;
    workingHours?: Record<string, string> | undefined;
}>;
/**
 * FAQ & Help Blueprint
 */
export declare const FAQBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    displayStyle: z.ZodDefault<z.ZodEnum<["accordion", "list"]>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    displayStyle: "accordion" | "list";
}, {
    enabled?: boolean | undefined;
    displayStyle?: "accordion" | "list" | undefined;
}>;
/**
 * Blog & Content Blueprint
 */
export declare const BlogBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    postsPerPage: z.ZodDefault<z.ZodNumber>;
    showAuthor: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    postsPerPage: number;
    showAuthor: boolean;
}, {
    enabled?: boolean | undefined;
    postsPerPage?: number | undefined;
    showAuthor?: boolean | undefined;
}>;
/**
 * System & SEO Blueprint
 */
export declare const SystemBlueprintSchema: z.ZodObject<{
    error404: z.ZodObject<{
        message: z.ZodDefault<z.ZodString>;
        suggestedLinks: z.ZodDefault<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            label: string;
            url: string;
        }, {
            label: string;
            url: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        suggestedLinks: {
            label: string;
            url: string;
        }[];
    }, {
        message?: string | undefined;
        suggestedLinks?: {
            label: string;
            url: string;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error404: {
        message: string;
        suggestedLinks: {
            label: string;
            url: string;
        }[];
    };
}, {
    error404: {
        message?: string | undefined;
        suggestedLinks?: {
            label: string;
            url: string;
        }[] | undefined;
    };
}>;
/**
 * Advanced Widgets Blueprint
 */
export declare const WidgetsBlueprintSchema: z.ZodObject<{
    maintenanceMode: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        message: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        enabled: boolean;
    }, {
        message?: string | undefined;
        enabled?: boolean | undefined;
    }>;
    newsletterPopup: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        delaySeconds: z.ZodDefault<z.ZodNumber>;
        title: z.ZodDefault<z.ZodString>;
        description: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        enabled: boolean;
        delaySeconds: number;
    }, {
        description?: string | undefined;
        title?: string | undefined;
        enabled?: boolean | undefined;
        delaySeconds?: number | undefined;
    }>;
    toastNotifications: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        durationMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        durationMs: number;
    }, {
        enabled?: boolean | undefined;
        durationMs?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    maintenanceMode: {
        message: string;
        enabled: boolean;
    };
    newsletterPopup: {
        description: string;
        title: string;
        enabled: boolean;
        delaySeconds: number;
    };
    toastNotifications: {
        enabled: boolean;
        durationMs: number;
    };
}, {
    maintenanceMode: {
        message?: string | undefined;
        enabled?: boolean | undefined;
    };
    newsletterPopup: {
        description?: string | undefined;
        title?: string | undefined;
        enabled?: boolean | undefined;
        delaySeconds?: number | undefined;
    };
    toastNotifications: {
        enabled?: boolean | undefined;
        durationMs?: number | undefined;
    };
}>;
/**
 * Global Search & Discovery Blueprint
 */
export declare const SearchBlueprintSchema: z.ZodObject<{
    ajaxSearch: z.ZodDefault<z.ZodBoolean>;
    resultLimit: z.ZodDefault<z.ZodNumber>;
    showPrice: z.ZodDefault<z.ZodBoolean>;
    showCategory: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    ajaxSearch: boolean;
    resultLimit: number;
    showPrice: boolean;
    showCategory: boolean;
}, {
    ajaxSearch?: boolean | undefined;
    resultLimit?: number | undefined;
    showPrice?: boolean | undefined;
    showCategory?: boolean | undefined;
}>;
/**
 * Smart Navigation Blueprint
 */
export declare const NavigationBlueprintSchema: z.ZodObject<{
    megaMenu: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        columns: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        columns: number;
        enabled: boolean;
    }, {
        columns?: number | undefined;
        enabled?: boolean | undefined;
    }>;
    smartFilters: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        collapsible: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        collapsible: boolean;
    }, {
        enabled?: boolean | undefined;
        collapsible?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    megaMenu: {
        columns: number;
        enabled: boolean;
    };
    smartFilters: {
        enabled: boolean;
        collapsible: boolean;
    };
}, {
    megaMenu: {
        columns?: number | undefined;
        enabled?: boolean | undefined;
    };
    smartFilters: {
        enabled?: boolean | undefined;
        collapsible?: boolean | undefined;
    };
}>;
/**
 * Trust & Communication Blueprint
 */
export declare const TrustBlueprintSchema: z.ZodObject<{
    whatsappFloat: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        phone: z.ZodOptional<z.ZodString>;
        message: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        enabled: boolean;
        phone?: string | undefined;
    }, {
        message?: string | undefined;
        phone?: string | undefined;
        enabled?: boolean | undefined;
    }>;
    socialWall: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        provider: z.ZodDefault<z.ZodEnum<["instagram", "tiktok"]>>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        enabled: boolean;
        provider: "instagram" | "tiktok";
    }, {
        limit?: number | undefined;
        enabled?: boolean | undefined;
        provider?: "instagram" | "tiktok" | undefined;
    }>;
    cookieConsent: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        text?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        text?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    whatsappFloat: {
        message: string;
        enabled: boolean;
        phone?: string | undefined;
    };
    socialWall: {
        limit: number;
        enabled: boolean;
        provider: "instagram" | "tiktok";
    };
    cookieConsent: {
        enabled: boolean;
        text?: string | undefined;
    };
}, {
    whatsappFloat: {
        message?: string | undefined;
        phone?: string | undefined;
        enabled?: boolean | undefined;
    };
    socialWall: {
        limit?: number | undefined;
        enabled?: boolean | undefined;
        provider?: "instagram" | "tiktok" | undefined;
    };
    cookieConsent: {
        enabled?: boolean | undefined;
        text?: string | undefined;
    };
}>;
/**
 * AI & Personalization Blueprint
 */
export declare const AIPersonalizationBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    showOnHome: z.ZodDefault<z.ZodBoolean>;
    showOnPDP: z.ZodDefault<z.ZodBoolean>;
    algorithm: z.ZodDefault<z.ZodEnum<["last_viewed", "collaborative_filtering"]>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    algorithm: "last_viewed" | "collaborative_filtering";
    showOnHome: boolean;
    showOnPDP: boolean;
}, {
    enabled?: boolean | undefined;
    algorithm?: "last_viewed" | "collaborative_filtering" | undefined;
    showOnHome?: boolean | undefined;
    showOnPDP?: boolean | undefined;
}>;
/**
 * Conversions & Gifting Blueprint
 */
export declare const GiftingBlueprintSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    wrappingEnabled: z.ZodDefault<z.ZodBoolean>;
    customCardsEnabled: z.ZodDefault<z.ZodBoolean>;
    wrappingPrice: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    wrappingEnabled: boolean;
    customCardsEnabled: boolean;
    wrappingPrice: number;
}, {
    enabled?: boolean | undefined;
    wrappingEnabled?: boolean | undefined;
    customCardsEnabled?: boolean | undefined;
    wrappingPrice?: number | undefined;
}>;
/**
 * Interactive Features Blueprint (Size Guide, Stories)
 */
export declare const InteractiveBlueprintSchema: z.ZodObject<{
    sizeGuideEnabled: z.ZodDefault<z.ZodBoolean>;
    orderTimelineStories: z.ZodDefault<z.ZodBoolean>;
    outOfStockNotify: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    sizeGuideEnabled: boolean;
    orderTimelineStories: boolean;
    outOfStockNotify: boolean;
}, {
    sizeGuideEnabled?: boolean | undefined;
    orderTimelineStories?: boolean | undefined;
    outOfStockNotify?: boolean | undefined;
}>;
/**
 * Master Blueprint - The "Brain" of the Store
 */
export declare const MasterBlueprintSchema: z.ZodObject<{
    home: z.ZodObject<{
        header: z.ZodObject<{
            logoUrl: z.ZodOptional<z.ZodString>;
            logoAlt: z.ZodOptional<z.ZodString>;
            navigation: z.ZodArray<z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                label: z.ZodString;
                url: z.ZodOptional<z.ZodString>;
                icon: z.ZodOptional<z.ZodString>;
                children: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            }, "strip", z.ZodTypeAny, {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }, {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }>, "many">;
            searchEnabled: z.ZodDefault<z.ZodBoolean>;
            searchDefaultText: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            navigation: {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }[];
            searchEnabled: boolean;
            logoUrl?: string | undefined;
            logoAlt?: string | undefined;
            searchDefaultText?: string | undefined;
        }, {
            navigation: {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }[];
            logoUrl?: string | undefined;
            logoAlt?: string | undefined;
            searchEnabled?: boolean | undefined;
            searchDefaultText?: string | undefined;
        }>;
        hero: z.ZodObject<{
            slides: z.ZodArray<z.ZodObject<{
                imageUrl: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
                subtitle: z.ZodOptional<z.ZodString>;
                buttonText: z.ZodOptional<z.ZodString>;
                buttonUrl: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }, {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }>, "many">;
            animationType: z.ZodDefault<z.ZodEnum<["fade", "slide"]>>;
            displayDuration: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            slides: {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }[];
            animationType: "fade" | "slide";
            displayDuration: number;
        }, {
            slides: {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }[];
            animationType?: "fade" | "slide" | undefined;
            displayDuration?: number | undefined;
        }>;
        flashSales: z.ZodOptional<z.ZodObject<{
            endTime: z.ZodString;
            products: z.ZodArray<z.ZodObject<{
                productId: z.ZodString;
                discountPercentage: z.ZodNumber;
                quantityLimit: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }, {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            products: {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }[];
            endTime: string;
        }, {
            products: {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }[];
            endTime: string;
        }>>;
        bentoGrid: z.ZodObject<{
            layoutId: z.ZodString;
            slots: z.ZodRecord<z.ZodString, z.ZodObject<{
                type: z.ZodEnum<["product", "category", "link"]>;
                referenceId: z.ZodOptional<z.ZodString>;
                customImage: z.ZodOptional<z.ZodString>;
                customText: z.ZodOptional<z.ZodString>;
                link: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            layoutId: string;
            slots: Record<string, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }>;
        }, {
            layoutId: string;
            slots: Record<string, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }>;
        }>;
        trust: z.ZodObject<{
            marqueeTexts: z.ZodArray<z.ZodString, "many">;
            serviceIcons: z.ZodArray<z.ZodObject<{
                iconName: z.ZodString;
                title: z.ZodString;
                description: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                description: string;
                title: string;
                iconName: string;
            }, {
                description: string;
                title: string;
                iconName: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            marqueeTexts: string[];
            serviceIcons: {
                description: string;
                title: string;
                iconName: string;
            }[];
        }, {
            marqueeTexts: string[];
            serviceIcons: {
                description: string;
                title: string;
                iconName: string;
            }[];
        }>;
        footer: z.ZodObject<{
            contact: z.ZodObject<{
                whatsapp: z.ZodOptional<z.ZodString>;
                email: z.ZodOptional<z.ZodString>;
                address: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            }, {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            }>;
            socialLinks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            policyLinksEnabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            contact: {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            };
            policyLinksEnabled: boolean;
            socialLinks?: Record<string, string> | undefined;
        }, {
            contact: {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            };
            socialLinks?: Record<string, string> | undefined;
            policyLinksEnabled?: boolean | undefined;
        }>;
        discovery: z.ZodObject<{
            algorithm: z.ZodDefault<z.ZodEnum<["best_seller", "new_arrivals"]>>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            algorithm: "best_seller" | "new_arrivals";
        }, {
            limit?: number | undefined;
            algorithm?: "best_seller" | "new_arrivals" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        header: {
            navigation: {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }[];
            searchEnabled: boolean;
            logoUrl?: string | undefined;
            logoAlt?: string | undefined;
            searchDefaultText?: string | undefined;
        };
        hero: {
            slides: {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }[];
            animationType: "fade" | "slide";
            displayDuration: number;
        };
        bentoGrid: {
            layoutId: string;
            slots: Record<string, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }>;
        };
        trust: {
            marqueeTexts: string[];
            serviceIcons: {
                description: string;
                title: string;
                iconName: string;
            }[];
        };
        footer: {
            contact: {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            };
            policyLinksEnabled: boolean;
            socialLinks?: Record<string, string> | undefined;
        };
        discovery: {
            limit: number;
            algorithm: "best_seller" | "new_arrivals";
        };
        flashSales?: {
            products: {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }[];
            endTime: string;
        } | undefined;
    }, {
        header: {
            navigation: {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }[];
            logoUrl?: string | undefined;
            logoAlt?: string | undefined;
            searchEnabled?: boolean | undefined;
            searchDefaultText?: string | undefined;
        };
        hero: {
            slides: {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }[];
            animationType?: "fade" | "slide" | undefined;
            displayDuration?: number | undefined;
        };
        bentoGrid: {
            layoutId: string;
            slots: Record<string, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }>;
        };
        trust: {
            marqueeTexts: string[];
            serviceIcons: {
                description: string;
                title: string;
                iconName: string;
            }[];
        };
        footer: {
            contact: {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            };
            socialLinks?: Record<string, string> | undefined;
            policyLinksEnabled?: boolean | undefined;
        };
        discovery: {
            limit?: number | undefined;
            algorithm?: "best_seller" | "new_arrivals" | undefined;
        };
        flashSales?: {
            products: {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }[];
            endTime: string;
        } | undefined;
    }>;
    pdp: z.ZodObject<{
        galleryEnabled: z.ZodDefault<z.ZodBoolean>;
        zoomEnabled: z.ZodDefault<z.ZodBoolean>;
        variantsDisplay: z.ZodDefault<z.ZodEnum<["dropdown", "swatches"]>>;
        reviewsEnabled: z.ZodDefault<z.ZodBoolean>;
        relatedProductsLimit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        galleryEnabled: boolean;
        zoomEnabled: boolean;
        variantsDisplay: "dropdown" | "swatches";
        reviewsEnabled: boolean;
        relatedProductsLimit: number;
    }, {
        galleryEnabled?: boolean | undefined;
        zoomEnabled?: boolean | undefined;
        variantsDisplay?: "dropdown" | "swatches" | undefined;
        reviewsEnabled?: boolean | undefined;
        relatedProductsLimit?: number | undefined;
    }>;
    quickView: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        showDescription: z.ZodDefault<z.ZodBoolean>;
        maxImages: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        showDescription: boolean;
        maxImages: number;
    }, {
        enabled?: boolean | undefined;
        showDescription?: boolean | undefined;
        maxImages?: number | undefined;
    }>;
    cart: z.ZodObject<{
        minOrderAmount: z.ZodDefault<z.ZodNumber>;
        allowCoupons: z.ZodDefault<z.ZodBoolean>;
        shippingEstimatorEnabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        minOrderAmount: number;
        allowCoupons: boolean;
        shippingEstimatorEnabled: boolean;
    }, {
        minOrderAmount?: number | undefined;
        allowCoupons?: boolean | undefined;
        shippingEstimatorEnabled?: boolean | undefined;
    }>;
    checkout: z.ZodObject<{
        paymentMethods: z.ZodArray<z.ZodEnum<["cod", "card", "paypal", "bank_transfer"]>, "many">;
        guestCheckoutEnabled: z.ZodDefault<z.ZodBoolean>;
        orderNotesEnabled: z.ZodDefault<z.ZodBoolean>;
        shippingZones: z.ZodArray<z.ZodObject<{
            region: z.ZodString;
            price: z.ZodNumber;
            estimatedDays: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            price: number;
            region: string;
            estimatedDays?: string | undefined;
        }, {
            price: number;
            region: string;
            estimatedDays?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        paymentMethods: ("cod" | "card" | "paypal" | "bank_transfer")[];
        guestCheckoutEnabled: boolean;
        orderNotesEnabled: boolean;
        shippingZones: {
            price: number;
            region: string;
            estimatedDays?: string | undefined;
        }[];
    }, {
        paymentMethods: ("cod" | "card" | "paypal" | "bank_transfer")[];
        shippingZones: {
            price: number;
            region: string;
            estimatedDays?: string | undefined;
        }[];
        guestCheckoutEnabled?: boolean | undefined;
        orderNotesEnabled?: boolean | undefined;
    }>;
    postPurchase: z.ZodObject<{
        orderSuccess: z.ZodObject<{
            showTrackButton: z.ZodDefault<z.ZodBoolean>;
            customMessage: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            showTrackButton: boolean;
            customMessage?: string | undefined;
        }, {
            showTrackButton?: boolean | undefined;
            customMessage?: string | undefined;
        }>;
        paymentFailure: z.ZodObject<{
            alternativeMethodsEnabled: z.ZodDefault<z.ZodBoolean>;
            supportPhone: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            alternativeMethodsEnabled: boolean;
            supportPhone?: string | undefined;
        }, {
            alternativeMethodsEnabled?: boolean | undefined;
            supportPhone?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        orderSuccess: {
            showTrackButton: boolean;
            customMessage?: string | undefined;
        };
        paymentFailure: {
            alternativeMethodsEnabled: boolean;
            supportPhone?: string | undefined;
        };
    }, {
        orderSuccess: {
            showTrackButton?: boolean | undefined;
            customMessage?: string | undefined;
        };
        paymentFailure: {
            alternativeMethodsEnabled?: boolean | undefined;
            supportPhone?: string | undefined;
        };
    }>;
    compare: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        comparableAttributes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        comparableAttributes: string[];
    }, {
        enabled?: boolean | undefined;
        comparableAttributes?: string[] | undefined;
    }>;
    locations: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        showMap: z.ZodDefault<z.ZodBoolean>;
        branchLimit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        showMap: boolean;
        branchLimit: number;
    }, {
        enabled?: boolean | undefined;
        showMap?: boolean | undefined;
        branchLimit?: number | undefined;
    }>;
    account: z.ZodObject<{
        loyaltyEnabled: z.ZodDefault<z.ZodBoolean>;
        pointsPerCurrency: z.ZodDefault<z.ZodNumber>;
        walletEnabled: z.ZodDefault<z.ZodBoolean>;
        minRedeemPoints: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        loyaltyEnabled: boolean;
        pointsPerCurrency: number;
        walletEnabled: boolean;
        minRedeemPoints: number;
    }, {
        loyaltyEnabled?: boolean | undefined;
        pointsPerCurrency?: number | undefined;
        walletEnabled?: boolean | undefined;
        minRedeemPoints?: number | undefined;
    }>;
    auth: z.ZodObject<{
        allowGoogleLogin: z.ZodDefault<z.ZodBoolean>;
        allowFacebookLogin: z.ZodDefault<z.ZodBoolean>;
        requirePhoneOTP: z.ZodDefault<z.ZodBoolean>;
        otpExpiryMinutes: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        allowGoogleLogin: boolean;
        allowFacebookLogin: boolean;
        requirePhoneOTP: boolean;
        otpExpiryMinutes: number;
    }, {
        allowGoogleLogin?: boolean | undefined;
        allowFacebookLogin?: boolean | undefined;
        requirePhoneOTP?: boolean | undefined;
        otpExpiryMinutes?: number | undefined;
    }>;
    tracking: z.ZodObject<{
        guestTrackingEnabled: z.ZodDefault<z.ZodBoolean>;
        showTimeline: z.ZodDefault<z.ZodBoolean>;
        timelineSteps: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        guestTrackingEnabled: boolean;
        showTimeline: boolean;
        timelineSteps: string[];
    }, {
        guestTrackingEnabled?: boolean | undefined;
        showTimeline?: boolean | undefined;
        timelineSteps?: string[] | undefined;
    }>;
    loyalty: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        pointsName: z.ZodDefault<z.ZodString>;
        currencyToPointsRatio: z.ZodDefault<z.ZodNumber>;
        redeemThreshold: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        pointsName: string;
        currencyToPointsRatio: number;
        redeemThreshold: number;
    }, {
        enabled?: boolean | undefined;
        pointsName?: string | undefined;
        currencyToPointsRatio?: number | undefined;
        redeemThreshold?: number | undefined;
    }>;
    wallet: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        allowTopup: z.ZodDefault<z.ZodBoolean>;
        cashbackPercentage: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        allowTopup: boolean;
        cashbackPercentage: number;
    }, {
        enabled?: boolean | undefined;
        allowTopup?: boolean | undefined;
        cashbackPercentage?: number | undefined;
    }>;
    referral: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        referralRewardAmount: z.ZodDefault<z.ZodNumber>;
        refereeRewardAmount: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        referralRewardAmount: number;
        refereeRewardAmount: number;
    }, {
        enabled?: boolean | undefined;
        referralRewardAmount?: number | undefined;
        refereeRewardAmount?: number | undefined;
    }>;
    rma: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        returnWindowDays: z.ZodDefault<z.ZodNumber>;
        requireEvidence: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        returnWindowDays: number;
        requireEvidence: boolean;
    }, {
        enabled?: boolean | undefined;
        returnWindowDays?: number | undefined;
        requireEvidence?: boolean | undefined;
    }>;
    legal: z.ZodObject<{
        privacyPolicyId: z.ZodOptional<z.ZodString>;
        termsOfServiceId: z.ZodOptional<z.ZodString>;
        refundPolicyId: z.ZodOptional<z.ZodString>;
        forceAcceptance: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        forceAcceptance: boolean;
        privacyPolicyId?: string | undefined;
        termsOfServiceId?: string | undefined;
        refundPolicyId?: string | undefined;
    }, {
        privacyPolicyId?: string | undefined;
        termsOfServiceId?: string | undefined;
        refundPolicyId?: string | undefined;
        forceAcceptance?: boolean | undefined;
    }>;
    support: z.ZodObject<{
        contactEmail: z.ZodOptional<z.ZodString>;
        contactPhone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>>;
        workingHours: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        address?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
        workingHours?: Record<string, string> | undefined;
    }, {
        address?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
        workingHours?: Record<string, string> | undefined;
    }>;
    faq: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        displayStyle: z.ZodDefault<z.ZodEnum<["accordion", "list"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        displayStyle: "accordion" | "list";
    }, {
        enabled?: boolean | undefined;
        displayStyle?: "accordion" | "list" | undefined;
    }>;
    blog: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        postsPerPage: z.ZodDefault<z.ZodNumber>;
        showAuthor: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        postsPerPage: number;
        showAuthor: boolean;
    }, {
        enabled?: boolean | undefined;
        postsPerPage?: number | undefined;
        showAuthor?: boolean | undefined;
    }>;
    system: z.ZodObject<{
        error404: z.ZodObject<{
            message: z.ZodDefault<z.ZodString>;
            suggestedLinks: z.ZodDefault<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                label: string;
                url: string;
            }, {
                label: string;
                url: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            suggestedLinks: {
                label: string;
                url: string;
            }[];
        }, {
            message?: string | undefined;
            suggestedLinks?: {
                label: string;
                url: string;
            }[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        error404: {
            message: string;
            suggestedLinks: {
                label: string;
                url: string;
            }[];
        };
    }, {
        error404: {
            message?: string | undefined;
            suggestedLinks?: {
                label: string;
                url: string;
            }[] | undefined;
        };
    }>;
    widgets: z.ZodObject<{
        maintenanceMode: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            message: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            enabled: boolean;
        }, {
            message?: string | undefined;
            enabled?: boolean | undefined;
        }>;
        newsletterPopup: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            delaySeconds: z.ZodDefault<z.ZodNumber>;
            title: z.ZodDefault<z.ZodString>;
            description: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            title: string;
            enabled: boolean;
            delaySeconds: number;
        }, {
            description?: string | undefined;
            title?: string | undefined;
            enabled?: boolean | undefined;
            delaySeconds?: number | undefined;
        }>;
        toastNotifications: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            durationMs: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            durationMs: number;
        }, {
            enabled?: boolean | undefined;
            durationMs?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        maintenanceMode: {
            message: string;
            enabled: boolean;
        };
        newsletterPopup: {
            description: string;
            title: string;
            enabled: boolean;
            delaySeconds: number;
        };
        toastNotifications: {
            enabled: boolean;
            durationMs: number;
        };
    }, {
        maintenanceMode: {
            message?: string | undefined;
            enabled?: boolean | undefined;
        };
        newsletterPopup: {
            description?: string | undefined;
            title?: string | undefined;
            enabled?: boolean | undefined;
            delaySeconds?: number | undefined;
        };
        toastNotifications: {
            enabled?: boolean | undefined;
            durationMs?: number | undefined;
        };
    }>;
    search: z.ZodObject<{
        ajaxSearch: z.ZodDefault<z.ZodBoolean>;
        resultLimit: z.ZodDefault<z.ZodNumber>;
        showPrice: z.ZodDefault<z.ZodBoolean>;
        showCategory: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        ajaxSearch: boolean;
        resultLimit: number;
        showPrice: boolean;
        showCategory: boolean;
    }, {
        ajaxSearch?: boolean | undefined;
        resultLimit?: number | undefined;
        showPrice?: boolean | undefined;
        showCategory?: boolean | undefined;
    }>;
    navigation: z.ZodObject<{
        megaMenu: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            columns: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            columns: number;
            enabled: boolean;
        }, {
            columns?: number | undefined;
            enabled?: boolean | undefined;
        }>;
        smartFilters: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            collapsible: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            collapsible: boolean;
        }, {
            enabled?: boolean | undefined;
            collapsible?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        megaMenu: {
            columns: number;
            enabled: boolean;
        };
        smartFilters: {
            enabled: boolean;
            collapsible: boolean;
        };
    }, {
        megaMenu: {
            columns?: number | undefined;
            enabled?: boolean | undefined;
        };
        smartFilters: {
            enabled?: boolean | undefined;
            collapsible?: boolean | undefined;
        };
    }>;
    trust: z.ZodObject<{
        whatsappFloat: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            phone: z.ZodOptional<z.ZodString>;
            message: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            enabled: boolean;
            phone?: string | undefined;
        }, {
            message?: string | undefined;
            phone?: string | undefined;
            enabled?: boolean | undefined;
        }>;
        socialWall: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            provider: z.ZodDefault<z.ZodEnum<["instagram", "tiktok"]>>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            enabled: boolean;
            provider: "instagram" | "tiktok";
        }, {
            limit?: number | undefined;
            enabled?: boolean | undefined;
            provider?: "instagram" | "tiktok" | undefined;
        }>;
        cookieConsent: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            text: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            text?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            text?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        whatsappFloat: {
            message: string;
            enabled: boolean;
            phone?: string | undefined;
        };
        socialWall: {
            limit: number;
            enabled: boolean;
            provider: "instagram" | "tiktok";
        };
        cookieConsent: {
            enabled: boolean;
            text?: string | undefined;
        };
    }, {
        whatsappFloat: {
            message?: string | undefined;
            phone?: string | undefined;
            enabled?: boolean | undefined;
        };
        socialWall: {
            limit?: number | undefined;
            enabled?: boolean | undefined;
            provider?: "instagram" | "tiktok" | undefined;
        };
        cookieConsent: {
            enabled?: boolean | undefined;
            text?: string | undefined;
        };
    }>;
    ai: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        showOnHome: z.ZodDefault<z.ZodBoolean>;
        showOnPDP: z.ZodDefault<z.ZodBoolean>;
        algorithm: z.ZodDefault<z.ZodEnum<["last_viewed", "collaborative_filtering"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        algorithm: "last_viewed" | "collaborative_filtering";
        showOnHome: boolean;
        showOnPDP: boolean;
    }, {
        enabled?: boolean | undefined;
        algorithm?: "last_viewed" | "collaborative_filtering" | undefined;
        showOnHome?: boolean | undefined;
        showOnPDP?: boolean | undefined;
    }>;
    gifting: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        wrappingEnabled: z.ZodDefault<z.ZodBoolean>;
        customCardsEnabled: z.ZodDefault<z.ZodBoolean>;
        wrappingPrice: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        wrappingEnabled: boolean;
        customCardsEnabled: boolean;
        wrappingPrice: number;
    }, {
        enabled?: boolean | undefined;
        wrappingEnabled?: boolean | undefined;
        customCardsEnabled?: boolean | undefined;
        wrappingPrice?: number | undefined;
    }>;
    interactive: z.ZodObject<{
        sizeGuideEnabled: z.ZodDefault<z.ZodBoolean>;
        orderTimelineStories: z.ZodDefault<z.ZodBoolean>;
        outOfStockNotify: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        sizeGuideEnabled: boolean;
        orderTimelineStories: boolean;
        outOfStockNotify: boolean;
    }, {
        sizeGuideEnabled?: boolean | undefined;
        orderTimelineStories?: boolean | undefined;
        outOfStockNotify?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    search: {
        ajaxSearch: boolean;
        resultLimit: number;
        showPrice: boolean;
        showCategory: boolean;
    };
    navigation: {
        megaMenu: {
            columns: number;
            enabled: boolean;
        };
        smartFilters: {
            enabled: boolean;
            collapsible: boolean;
        };
    };
    trust: {
        whatsappFloat: {
            message: string;
            enabled: boolean;
            phone?: string | undefined;
        };
        socialWall: {
            limit: number;
            enabled: boolean;
            provider: "instagram" | "tiktok";
        };
        cookieConsent: {
            enabled: boolean;
            text?: string | undefined;
        };
    };
    home: {
        header: {
            navigation: {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }[];
            searchEnabled: boolean;
            logoUrl?: string | undefined;
            logoAlt?: string | undefined;
            searchDefaultText?: string | undefined;
        };
        hero: {
            slides: {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }[];
            animationType: "fade" | "slide";
            displayDuration: number;
        };
        bentoGrid: {
            layoutId: string;
            slots: Record<string, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }>;
        };
        trust: {
            marqueeTexts: string[];
            serviceIcons: {
                description: string;
                title: string;
                iconName: string;
            }[];
        };
        footer: {
            contact: {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            };
            policyLinksEnabled: boolean;
            socialLinks?: Record<string, string> | undefined;
        };
        discovery: {
            limit: number;
            algorithm: "best_seller" | "new_arrivals";
        };
        flashSales?: {
            products: {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }[];
            endTime: string;
        } | undefined;
    };
    pdp: {
        galleryEnabled: boolean;
        zoomEnabled: boolean;
        variantsDisplay: "dropdown" | "swatches";
        reviewsEnabled: boolean;
        relatedProductsLimit: number;
    };
    quickView: {
        enabled: boolean;
        showDescription: boolean;
        maxImages: number;
    };
    cart: {
        minOrderAmount: number;
        allowCoupons: boolean;
        shippingEstimatorEnabled: boolean;
    };
    checkout: {
        paymentMethods: ("cod" | "card" | "paypal" | "bank_transfer")[];
        guestCheckoutEnabled: boolean;
        orderNotesEnabled: boolean;
        shippingZones: {
            price: number;
            region: string;
            estimatedDays?: string | undefined;
        }[];
    };
    postPurchase: {
        orderSuccess: {
            showTrackButton: boolean;
            customMessage?: string | undefined;
        };
        paymentFailure: {
            alternativeMethodsEnabled: boolean;
            supportPhone?: string | undefined;
        };
    };
    compare: {
        enabled: boolean;
        comparableAttributes: string[];
    };
    locations: {
        enabled: boolean;
        showMap: boolean;
        branchLimit: number;
    };
    account: {
        loyaltyEnabled: boolean;
        pointsPerCurrency: number;
        walletEnabled: boolean;
        minRedeemPoints: number;
    };
    auth: {
        allowGoogleLogin: boolean;
        allowFacebookLogin: boolean;
        requirePhoneOTP: boolean;
        otpExpiryMinutes: number;
    };
    tracking: {
        guestTrackingEnabled: boolean;
        showTimeline: boolean;
        timelineSteps: string[];
    };
    loyalty: {
        enabled: boolean;
        pointsName: string;
        currencyToPointsRatio: number;
        redeemThreshold: number;
    };
    wallet: {
        enabled: boolean;
        allowTopup: boolean;
        cashbackPercentage: number;
    };
    referral: {
        enabled: boolean;
        referralRewardAmount: number;
        refereeRewardAmount: number;
    };
    rma: {
        enabled: boolean;
        returnWindowDays: number;
        requireEvidence: boolean;
    };
    legal: {
        forceAcceptance: boolean;
        privacyPolicyId?: string | undefined;
        termsOfServiceId?: string | undefined;
        refundPolicyId?: string | undefined;
    };
    support: {
        address?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
        workingHours?: Record<string, string> | undefined;
    };
    faq: {
        enabled: boolean;
        displayStyle: "accordion" | "list";
    };
    blog: {
        enabled: boolean;
        postsPerPage: number;
        showAuthor: boolean;
    };
    system: {
        error404: {
            message: string;
            suggestedLinks: {
                label: string;
                url: string;
            }[];
        };
    };
    widgets: {
        maintenanceMode: {
            message: string;
            enabled: boolean;
        };
        newsletterPopup: {
            description: string;
            title: string;
            enabled: boolean;
            delaySeconds: number;
        };
        toastNotifications: {
            enabled: boolean;
            durationMs: number;
        };
    };
    ai: {
        enabled: boolean;
        algorithm: "last_viewed" | "collaborative_filtering";
        showOnHome: boolean;
        showOnPDP: boolean;
    };
    gifting: {
        enabled: boolean;
        wrappingEnabled: boolean;
        customCardsEnabled: boolean;
        wrappingPrice: number;
    };
    interactive: {
        sizeGuideEnabled: boolean;
        orderTimelineStories: boolean;
        outOfStockNotify: boolean;
    };
}, {
    search: {
        ajaxSearch?: boolean | undefined;
        resultLimit?: number | undefined;
        showPrice?: boolean | undefined;
        showCategory?: boolean | undefined;
    };
    navigation: {
        megaMenu: {
            columns?: number | undefined;
            enabled?: boolean | undefined;
        };
        smartFilters: {
            enabled?: boolean | undefined;
            collapsible?: boolean | undefined;
        };
    };
    trust: {
        whatsappFloat: {
            message?: string | undefined;
            phone?: string | undefined;
            enabled?: boolean | undefined;
        };
        socialWall: {
            limit?: number | undefined;
            enabled?: boolean | undefined;
            provider?: "instagram" | "tiktok" | undefined;
        };
        cookieConsent: {
            enabled?: boolean | undefined;
            text?: string | undefined;
        };
    };
    home: {
        header: {
            navigation: {
                label: string;
                id?: string | undefined;
                url?: string | undefined;
                icon?: string | undefined;
                children?: any[] | undefined;
            }[];
            logoUrl?: string | undefined;
            logoAlt?: string | undefined;
            searchEnabled?: boolean | undefined;
            searchDefaultText?: string | undefined;
        };
        hero: {
            slides: {
                imageUrl: string;
                title?: string | undefined;
                subtitle?: string | undefined;
                buttonText?: string | undefined;
                buttonUrl?: string | undefined;
            }[];
            animationType?: "fade" | "slide" | undefined;
            displayDuration?: number | undefined;
        };
        bentoGrid: {
            layoutId: string;
            slots: Record<string, {
                type: "link" | "product" | "category";
                link?: string | undefined;
                referenceId?: string | undefined;
                customImage?: string | undefined;
                customText?: string | undefined;
            }>;
        };
        trust: {
            marqueeTexts: string[];
            serviceIcons: {
                description: string;
                title: string;
                iconName: string;
            }[];
        };
        footer: {
            contact: {
                email?: string | undefined;
                whatsapp?: string | undefined;
                address?: string | undefined;
            };
            socialLinks?: Record<string, string> | undefined;
            policyLinksEnabled?: boolean | undefined;
        };
        discovery: {
            limit?: number | undefined;
            algorithm?: "best_seller" | "new_arrivals" | undefined;
        };
        flashSales?: {
            products: {
                productId: string;
                discountPercentage: number;
                quantityLimit: number;
            }[];
            endTime: string;
        } | undefined;
    };
    pdp: {
        galleryEnabled?: boolean | undefined;
        zoomEnabled?: boolean | undefined;
        variantsDisplay?: "dropdown" | "swatches" | undefined;
        reviewsEnabled?: boolean | undefined;
        relatedProductsLimit?: number | undefined;
    };
    quickView: {
        enabled?: boolean | undefined;
        showDescription?: boolean | undefined;
        maxImages?: number | undefined;
    };
    cart: {
        minOrderAmount?: number | undefined;
        allowCoupons?: boolean | undefined;
        shippingEstimatorEnabled?: boolean | undefined;
    };
    checkout: {
        paymentMethods: ("cod" | "card" | "paypal" | "bank_transfer")[];
        shippingZones: {
            price: number;
            region: string;
            estimatedDays?: string | undefined;
        }[];
        guestCheckoutEnabled?: boolean | undefined;
        orderNotesEnabled?: boolean | undefined;
    };
    postPurchase: {
        orderSuccess: {
            showTrackButton?: boolean | undefined;
            customMessage?: string | undefined;
        };
        paymentFailure: {
            alternativeMethodsEnabled?: boolean | undefined;
            supportPhone?: string | undefined;
        };
    };
    compare: {
        enabled?: boolean | undefined;
        comparableAttributes?: string[] | undefined;
    };
    locations: {
        enabled?: boolean | undefined;
        showMap?: boolean | undefined;
        branchLimit?: number | undefined;
    };
    account: {
        loyaltyEnabled?: boolean | undefined;
        pointsPerCurrency?: number | undefined;
        walletEnabled?: boolean | undefined;
        minRedeemPoints?: number | undefined;
    };
    auth: {
        allowGoogleLogin?: boolean | undefined;
        allowFacebookLogin?: boolean | undefined;
        requirePhoneOTP?: boolean | undefined;
        otpExpiryMinutes?: number | undefined;
    };
    tracking: {
        guestTrackingEnabled?: boolean | undefined;
        showTimeline?: boolean | undefined;
        timelineSteps?: string[] | undefined;
    };
    loyalty: {
        enabled?: boolean | undefined;
        pointsName?: string | undefined;
        currencyToPointsRatio?: number | undefined;
        redeemThreshold?: number | undefined;
    };
    wallet: {
        enabled?: boolean | undefined;
        allowTopup?: boolean | undefined;
        cashbackPercentage?: number | undefined;
    };
    referral: {
        enabled?: boolean | undefined;
        referralRewardAmount?: number | undefined;
        refereeRewardAmount?: number | undefined;
    };
    rma: {
        enabled?: boolean | undefined;
        returnWindowDays?: number | undefined;
        requireEvidence?: boolean | undefined;
    };
    legal: {
        privacyPolicyId?: string | undefined;
        termsOfServiceId?: string | undefined;
        refundPolicyId?: string | undefined;
        forceAcceptance?: boolean | undefined;
    };
    support: {
        address?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | undefined;
        coordinates?: {
            lat: number;
            lng: number;
        } | undefined;
        workingHours?: Record<string, string> | undefined;
    };
    faq: {
        enabled?: boolean | undefined;
        displayStyle?: "accordion" | "list" | undefined;
    };
    blog: {
        enabled?: boolean | undefined;
        postsPerPage?: number | undefined;
        showAuthor?: boolean | undefined;
    };
    system: {
        error404: {
            message?: string | undefined;
            suggestedLinks?: {
                label: string;
                url: string;
            }[] | undefined;
        };
    };
    widgets: {
        maintenanceMode: {
            message?: string | undefined;
            enabled?: boolean | undefined;
        };
        newsletterPopup: {
            description?: string | undefined;
            title?: string | undefined;
            enabled?: boolean | undefined;
            delaySeconds?: number | undefined;
        };
        toastNotifications: {
            enabled?: boolean | undefined;
            durationMs?: number | undefined;
        };
    };
    ai: {
        enabled?: boolean | undefined;
        algorithm?: "last_viewed" | "collaborative_filtering" | undefined;
        showOnHome?: boolean | undefined;
        showOnPDP?: boolean | undefined;
    };
    gifting: {
        enabled?: boolean | undefined;
        wrappingEnabled?: boolean | undefined;
        customCardsEnabled?: boolean | undefined;
        wrappingPrice?: number | undefined;
    };
    interactive: {
        sizeGuideEnabled?: boolean | undefined;
        orderTimelineStories?: boolean | undefined;
        outOfStockNotify?: boolean | undefined;
    };
}>;
export type HomePageBlueprint = z.infer<typeof HomePageBlueprintSchema>;
export type MasterBlueprint = z.infer<typeof MasterBlueprintSchema>;
//# sourceMappingURL=blueprint.schema.d.ts.map