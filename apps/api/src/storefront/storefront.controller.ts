import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { StorefrontService } from './storefront.service.js';

const TenantIdSchema = z.object({
  tenantId: z.string().optional(),
});

type TenantIdDto = z.infer<typeof TenantIdSchema>;

const ProductsQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
});

type ProductsQueryDto = z.infer<typeof ProductsQuerySchema>;

@Controller({ path: 'storefront', version: VERSION_NEUTRAL })
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) { }

  @Get('config')
  async getConfig(@Query(ZodValidationPipe) query: TenantIdDto) {
    return this.storefrontService.getTenantConfig(query.tenantId);
  }

  @Get('products')
  async getProducts(@Query(ZodValidationPipe) query: ProductsQueryDto) {
    return this.storefrontService.getProducts(query);
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.storefrontService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Get('home')
  async getHome(@Query(ZodValidationPipe) query: TenantIdDto) {
    return this.storefrontService.getHomeData(query.tenantId);
  }
}
