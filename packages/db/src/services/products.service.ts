import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { withTenantConnection } from '../core.js';
import {
  type NewProduct,
  type Product,
  products,
} from '../schema/storefront/products.js';

/**
 * Product Input with numeric values (as coming from API/DTO)
 * Note: Prices are expected in cents (BIGINT).
 */
export interface ProductInput
  extends Omit<
    NewProduct,
    'basePrice' | 'salePrice' | 'taxPercentage' | 'weight'
  > {
  basePrice: number;
  salePrice?: number | null;
  taxPercentage?: number | null;
  weight?: number | null;
}

export type ProductUpdateInput = Partial<ProductInput>;

/**
 * Products Service — V5 Standard
 * Handles CRUD operations for products within tenant-specific schemas.
 * Implementations: S2 (Isolation), Soft Delete, BIGINT money.
 */
@Injectable()
export class ProductsService {
  /**
   * Helper to map numeric API inputs to Drizzle BIGINT numbers
   * mode: 'number' in schema handles the BIGINT <-> number mapping.
   */
  private sanitizeProductData(
    data: ProductInput | ProductUpdateInput
  ): Partial<NewProduct> {
    const { ...sanitized } = data;

    // mode: 'number' expects numbers, not strings.
    if (data.basePrice !== undefined)
      sanitized.basePrice = Math.round(data.basePrice);
    if (data.salePrice !== undefined)
      sanitized.salePrice = data.salePrice ? Math.round(data.salePrice) : null;
    if (data.taxPercentage !== undefined)
      sanitized.taxPercentage = data.taxPercentage
        ? Math.round(data.taxPercentage)
        : 0;
    if (data.weight !== undefined)
      sanitized.weight = data.weight ? Math.round(data.weight) : null;

    return sanitized as Partial<NewProduct>;
  }

  /**
   * Create a new product.
   */
  async create(tenantId: string, data: ProductInput): Promise<Product> {
    const sanitizedData = this.sanitizeProductData(data) as NewProduct;

    // S2 FIX: Use isolated transaction
    return await withTenantConnection(tenantId, async (db) => {
      const [newProduct] = await db
        .insert(products)
        .values(sanitizedData)
        .returning();

      return newProduct;
    });
  }

  /**
   * Find all active products (S5: Soft Delete Filter).
   */
  async findAll(tenantId: string): Promise<Product[]> {
    return await withTenantConnection(tenantId, async (db) => {
      return await db
        .select()
        .from(products)
        .where(isNull(products.deletedAt))
        .orderBy(sql`${products.createdAt} DESC`);
    });
  }

  /**
   * Find a product by ID (S5: Soft Delete Filter).
   */
  async findById(tenantId: string, id: string): Promise<Product | null> {
    return await withTenantConnection(tenantId, async (db) => {
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), isNull(products.deletedAt)))
        .limit(1);

      return product || null;
    });
  }

  /**
   * Update a product.
   * Mandate #9: Strict Optimistic Concurrency Control (OCC).
   */
  async update(
    tenantId: string,
    id: string,
    expectedVersion: number,
    data: ProductUpdateInput
  ): Promise<Product> {
    const sanitizedData = this.sanitizeProductData(data);
    const updatePayload = {
      ...sanitizedData,
      // Audit 444 Point #1: Deleted manual version/updatedAt. DB trigger handle_occ_version_increment handles it.
    };

    return await withTenantConnection(tenantId, async (db) => {
      const [updatedProduct] = await db
        .update(products)
        .set(updatePayload)
        .where(
          and(
            eq(products.id, id),
            eq(products.version, expectedVersion),
            isNull(products.deletedAt)
          )
        )
        .returning();

      if (!updatedProduct) {
        throw new Error('STALE_DATA_OR_NOT_FOUND');
      }

      return updatedProduct;
    });
  }

  /**
   * Soft Delete a product (V5 Standard).
   */
  async delete(tenantId: string, id: string): Promise<boolean> {
    return await withTenantConnection(tenantId, async (db) => {
      const result = await db
        .update(products)
        .set({ deletedAt: sql`CLOCK_TIMESTAMP()` })
        .where(and(eq(products.id, id), isNull(products.deletedAt)))
        .returning({ id: products.id });

      return result.length > 0;
    });
  }
}
