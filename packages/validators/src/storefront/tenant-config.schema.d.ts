/**
 * Tenant Configuration Schema
 *
 * Defines the configuration structure for tenant branding,
 * locale settings, and feature flags.
 *
 * @module @apex/validators/storefront/tenant-config
 */
import { z } from 'zod';
/**
 * Tenant branding, locale, and feature configuration
 */
export declare const TenantConfigSchema: z.ZodObject<{
    tenantId: z.ZodString;
    subdomain: z.ZodString;
    storeName: z.ZodString;
    logoUrl: z.ZodNullable<z.ZodString>;
    faviconUrl: z.ZodNullable<z.ZodString>;
    primaryColor: z.ZodString;
    secondaryColor: z.ZodString;
    fontFamily: z.ZodEnum<["Inter", "Roboto", "Poppins", "Cairo", "Tajawal"]>;
    defaultLanguage: z.ZodEnum<["en", "ar", "fr"]>;
    currency: z.ZodString;
    timezone: z.ZodEffects<z.ZodString, string, string>;
    rtlEnabled: z.ZodBoolean;
    features: z.ZodObject<{
        wishlist: z.ZodBoolean;
        compareProducts: z.ZodBoolean;
        reviews: z.ZodBoolean;
        loyalty: z.ZodBoolean;
        b2b: z.ZodBoolean;
        affiliates: z.ZodBoolean;
        aiRecommendations: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    }, {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    }>;
    socialLinks: z.ZodObject<{
        instagram: z.ZodNullable<z.ZodString>;
        twitter: z.ZodNullable<z.ZodString>;
        facebook: z.ZodNullable<z.ZodString>;
        whatsapp: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    }, {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    }>;
    contactEmail: z.ZodString;
    contactPhone: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    subdomain: string;
    tenantId: string;
    storeName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: "Inter" | "Roboto" | "Poppins" | "Cairo" | "Tajawal";
    defaultLanguage: "en" | "ar" | "fr";
    timezone: string;
    rtlEnabled: boolean;
    features: {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    };
    socialLinks: {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    };
    contactEmail: string;
    contactPhone: string | null;
    address: string | null;
}, {
    currency: string;
    subdomain: string;
    tenantId: string;
    storeName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: "Inter" | "Roboto" | "Poppins" | "Cairo" | "Tajawal";
    defaultLanguage: "en" | "ar" | "fr";
    timezone: string;
    rtlEnabled: boolean;
    features: {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    };
    socialLinks: {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    };
    contactEmail: string;
    contactPhone: string | null;
    address: string | null;
}>;
/**
 * TypeScript type inferred from TenantConfigSchema
 */
export type TenantConfig = z.infer<typeof TenantConfigSchema>;
/**
 * Partial tenant config for updates
 */
export declare const TenantConfigUpdateSchema: z.ZodObject<Omit<{
    tenantId: z.ZodOptional<z.ZodString>;
    subdomain: z.ZodOptional<z.ZodString>;
    storeName: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    faviconUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    primaryColor: z.ZodOptional<z.ZodString>;
    secondaryColor: z.ZodOptional<z.ZodString>;
    fontFamily: z.ZodOptional<z.ZodEnum<["Inter", "Roboto", "Poppins", "Cairo", "Tajawal"]>>;
    defaultLanguage: z.ZodOptional<z.ZodEnum<["en", "ar", "fr"]>>;
    currency: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    rtlEnabled: z.ZodOptional<z.ZodBoolean>;
    features: z.ZodOptional<z.ZodObject<{
        wishlist: z.ZodBoolean;
        compareProducts: z.ZodBoolean;
        reviews: z.ZodBoolean;
        loyalty: z.ZodBoolean;
        b2b: z.ZodBoolean;
        affiliates: z.ZodBoolean;
        aiRecommendations: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    }, {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    }>>;
    socialLinks: z.ZodOptional<z.ZodObject<{
        instagram: z.ZodNullable<z.ZodString>;
        twitter: z.ZodNullable<z.ZodString>;
        facebook: z.ZodNullable<z.ZodString>;
        whatsapp: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    }, {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    }>>;
    contactEmail: z.ZodOptional<z.ZodString>;
    contactPhone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "subdomain" | "tenantId">, "strip", z.ZodTypeAny, {
    currency?: string | undefined;
    storeName?: string | undefined;
    logoUrl?: string | null | undefined;
    faviconUrl?: string | null | undefined;
    primaryColor?: string | undefined;
    secondaryColor?: string | undefined;
    fontFamily?: "Inter" | "Roboto" | "Poppins" | "Cairo" | "Tajawal" | undefined;
    defaultLanguage?: "en" | "ar" | "fr" | undefined;
    timezone?: string | undefined;
    rtlEnabled?: boolean | undefined;
    features?: {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    } | undefined;
    socialLinks?: {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    } | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | null | undefined;
    address?: string | null | undefined;
}, {
    currency?: string | undefined;
    storeName?: string | undefined;
    logoUrl?: string | null | undefined;
    faviconUrl?: string | null | undefined;
    primaryColor?: string | undefined;
    secondaryColor?: string | undefined;
    fontFamily?: "Inter" | "Roboto" | "Poppins" | "Cairo" | "Tajawal" | undefined;
    defaultLanguage?: "en" | "ar" | "fr" | undefined;
    timezone?: string | undefined;
    rtlEnabled?: boolean | undefined;
    features?: {
        wishlist: boolean;
        compareProducts: boolean;
        reviews: boolean;
        loyalty: boolean;
        b2b: boolean;
        affiliates: boolean;
        aiRecommendations: boolean;
    } | undefined;
    socialLinks?: {
        instagram: string | null;
        twitter: string | null;
        facebook: string | null;
        whatsapp: string | null;
    } | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | null | undefined;
    address?: string | null | undefined;
}>;
export type TenantConfigUpdate = z.infer<typeof TenantConfigUpdateSchema>;
//# sourceMappingURL=tenant-config.schema.d.ts.map