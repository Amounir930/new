import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { z } from 'zod';
import type { StorefrontService } from './storefront.service.js';

const TenantIdSchema = z.object({
  tenantId: z.string().optional(),
});

const ProductsQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
});

@Controller({ path: 'storefront', version: VERSION_NEUTRAL })
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) { }

  @Get('config')
  async getConfig(@Query() query: any) {
    const validated = TenantIdSchema.parse(query);
    return this.storefrontService.getTenantConfig(validated.tenantId);
  }

  @Get('products')
  async getProducts(@Query() query: any) {
    const validated = ProductsQuerySchema.parse(query);
    return this.storefrontService.getProducts(validated);
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
  async getHome(@Query() query: any) {
    const validated = TenantIdSchema.parse(query);
    return this.storefrontService.getHomeData(validated.tenantId);
  }
}
