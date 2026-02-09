import { describe, expect, it } from 'vitest';
import { TemplateConfigSchema } from './schemas.js';

describe('TemplateConfigSchema', () => {
    const validConfig = {
        name: 'fashion-boutique',
        displayName: 'Fashion Boutique Template',
        version: '1.0.0',
        description: 'A premium fashion boutique template for high-end brands.',
        category: 'fashion',
        tags: ['modern', 'responsive'],
        author: {
            name: 'Apex Team',
            email: 'team@apex.com',
        },
        preview: {
            image: 'https://example.com/preview.jpg',
            demoUrl: 'https://demo.example.com',
        },
        features: {
            pages: {
                home: true,
                productListing: true,
                productDetails: true,
                cart: true,
                checkout: true,
            },
        },
        requirements: {
            apexVersion: '>=2.0.0',
        },
        locales: ['en', 'ar'],
        rtlSupport: true,
    };

    it('should validate valid template config', () => {
        const result = TemplateConfigSchema.safeParse(validConfig);
        expect(result.success).toBe(true);
    });

    it('should reject non-kebab-case name', () => {
        const result = TemplateConfigSchema.safeParse({
            ...validConfig,
            name: 'FashionBoutique',
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid version format', () => {
        const result = TemplateConfigSchema.safeParse({
            ...validConfig,
            version: '1.0',
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid author email', () => {
        const result = TemplateConfigSchema.safeParse({
            ...validConfig,
            author: { ...validConfig.author, email: 'invalid' },
        });
        expect(result.success).toBe(false);
    });

    it('should reject unknown category', () => {
        const result = TemplateConfigSchema.safeParse({
            ...validConfig,
            category: 'unknown',
        });
        expect(result.success).toBe(false);
    });
});
