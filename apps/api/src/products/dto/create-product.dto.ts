import { BaseCreateProductSchema } from '@apex/validation';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 7 Sections of Product Data
 * S3: Input Validation
 * Mandate: Shares BaseCreateProductSchema from @apex/validation
 */

export class CreateProductDto {
  nameAr!: string;
  nameEn!: string;
  slug!: string;
  sku!: string;
  brandId?: string;
  categoryId?: string;
  basePrice!: number;
  salePrice?: number;
  taxPercentage?: number;
  stockQuantity?: number;
  minOrderQty?: number;
  trackInventory?: boolean;
  weight?: number;
  dimensions?: { h?: number; w?: number; l?: number };
  videoUrl?: string;
  packageContentsAr?: string;
  packageContentsEn?: string;
  countryOfOrigin?: string;
  mainImage!: string;
  galleryImages!: { url: string; altText?: string; order: number }[];
  shortDescriptionAr?: string;
  shortDescriptionEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  metaTitle?: string;
  metaDescription?: string;
  specifications!: Record<string, unknown>;
  niche!:
    | 'retail'
    | 'wellness'
    | 'education'
    | 'services'
    | 'hospitality'
    | 'real_estate'
    | 'creative';
  attributes!: Record<string, unknown>;
}

export class UpdateProductDto extends CreateProductDto {
  version!: number;
}
