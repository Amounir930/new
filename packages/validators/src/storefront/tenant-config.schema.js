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
export const TenantConfigSchema = z.object({
    tenantId: z.string().uuid({
        message: 'Tenant ID must be a valid UUID',
    }),
    subdomain: z
        .string()
        .min(3, 'Subdomain must be at least 3 characters')
        .max(63, 'Subdomain cannot exceed 63 characters')
        .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens'),
    storeName: z
        .string()
        .min(1, 'Store name is required')
        .max(100, 'Store name cannot exceed 100 characters'),
    // ═══════════════════════════════════════════════════════════
    // Branding
    // ═══════════════════════════════════════════════════════════
    logoUrl: z.string().url('Invalid logo URL').nullable(),
    faviconUrl: z.string().url('Invalid favicon URL').nullable(),
    primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color (e.g., #2563eb)'),
    secondaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color'),
    fontFamily: z.enum(['Inter', 'Roboto', 'Poppins', 'Cairo', 'Tajawal'], {
        errorMap: () => ({
            message: 'Font family must be one of: Inter, Roboto, Poppins, Cairo, Tajawal',
        }),
    }),
    // ═══════════════════════════════════════════════════════════
    // Locale Settings
    // ═══════════════════════════════════════════════════════════
    defaultLanguage: z.enum(['en', 'ar', 'fr'], {
        errorMap: () => ({ message: 'Language must be one of: en, ar, fr' }),
    }),
    currency: z
        .string()
        .length(3, 'Currency code must be 3 characters (ISO 4217)')
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, 'Currency must be ISO 4217 format (e.g., USD, SAR)'),
    timezone: z
        .string()
        .min(1, 'Timezone is required')
        .refine((tz) => {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: tz });
            return true;
        }
        catch {
            return false;
        }
    }, { message: 'Invalid timezone (must be IANA timezone identifier)' }),
    rtlEnabled: z.boolean(),
    // ═══════════════════════════════════════════════════════════
    // Feature Flags
    // ═══════════════════════════════════════════════════════════
    features: z.object({
        wishlist: z.boolean(),
        compareProducts: z.boolean(),
        reviews: z.boolean(),
        loyalty: z.boolean(),
        b2b: z.boolean(),
        affiliates: z.boolean(),
        aiRecommendations: z.boolean(),
    }),
    // ═══════════════════════════════════════════════════════════
    // Social Links
    // ═══════════════════════════════════════════════════════════
    socialLinks: z.object({
        instagram: z.string().url('Invalid Instagram URL').nullable(),
        twitter: z.string().url('Invalid Twitter URL').nullable(),
        facebook: z.string().url('Invalid Facebook URL').nullable(),
        whatsapp: z.string().nullable(),
    }),
    // ═══════════════════════════════════════════════════════════
    // Contact Information
    // ═══════════════════════════════════════════════════════════
    contactEmail: z.string().email('Invalid contact email'),
    contactPhone: z.string().nullable(),
    address: z.string().nullable(),
});
/**
 * Partial tenant config for updates
 */
export const TenantConfigUpdateSchema = TenantConfigSchema.partial().omit({
    tenantId: true,
    subdomain: true,
});
//# sourceMappingURL=tenant-config.schema.js.map