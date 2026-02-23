import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { publicDb } from '../connection.js';
import {
    type Product,
    type NewProduct,
    products,
} from '../schema/storefront/products.js';

/**
 * Product Input with numeric values (as coming from API/DTO)
 */
export interface ProductInput extends Omit<NewProduct, 'basePrice' | 'salePrice' | 'taxPercentage' | 'weight'> {
    basePrice: number;
    salePrice?: number;
    taxPercentage?: number;
    weight?: number;
}

export type ProductUpdateInput = Partial<ProductInput>;

/**
 * Products Service
 * Handles CRUD operations for products within tenant-specific schemas.
 * (S2 Isolation Enforcement)
 */
@Injectable()
export class ProductsService {
    /**
     * Helper to map numeric API inputs to Drizzle Decimal strings
     * S3: Strict mapping to maintain precision
     */
    private sanitizeProductData(data: ProductInput | ProductUpdateInput): NewProduct {
        const sanitized: Record<string, unknown> = { ...data };

        if (data.basePrice !== undefined && data.basePrice !== null) {
            sanitized.basePrice = data.basePrice.toString();
        }
        if (data.salePrice !== undefined && data.salePrice !== null) {
            sanitized.salePrice = data.salePrice.toString();
        }
        if (data.taxPercentage !== undefined && data.taxPercentage !== null) {
            sanitized.taxPercentage = data.taxPercentage.toString();
        }
        if (data.weight !== undefined && data.weight !== null) {
            sanitized.weight = data.weight.toString();
        }

        return sanitized as NewProduct;
    }

    /**
     * Create a new product.
     * Assumes the database context (search_path) is already set by middleware.
     */
    async create(data: ProductInput): Promise<Product> {
        const sanitizedData = this.sanitizeProductData(data);

        const [newProduct] = await publicDb
            .insert(products)
            .values(sanitizedData)
            .returning();

        return newProduct;
    }

    /**
     * Find all products for the current tenant.
     */
    async findAll(): Promise<Product[]> {
        return await publicDb
            .select()
            .from(products)
            .orderBy(sql`${products.createdAt} DESC`);
    }

    /**
     * Find a product by ID.
     */
    async findById(id: string): Promise<Product | null> {
        const [product] = await publicDb
            .select()
            .from(products)
            .where(eq(products.id, id))
            .limit(1);

        return product || null;
    }

    /**
     * Update a product.
     */
    async update(id: string, data: ProductUpdateInput): Promise<Product> {
        const sanitizedData = this.sanitizeProductData(data);
        const updatePayload = {
            ...sanitizedData,
            updatedAt: new Date(),
        };

        const [updatedProduct] = await publicDb
            .update(products)
            .set(updatePayload)
            .where(eq(products.id, id))
            .returning();

        return updatedProduct;
    }

    /**
     * Delete a product.
     */
    async delete(id: string): Promise<boolean> {
        const result = await publicDb
            .delete(products)
            .where(eq(products.id, id))
            .returning({ id: products.id });

        return result.length > 0;
    }
}
