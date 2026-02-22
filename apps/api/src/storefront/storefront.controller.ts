import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  Query,
  VERSION_NEUTRAL,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { AuditLog } from '@apex/audit';
import { RateLimit } from '@apex/middleware';
import { StorefrontService } from './storefront.service.js';
import { NewsletterSubscriptionDto } from './dto/newsletter.dto.js';

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
@UsePipes(ZodValidationPipe)
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) { }

  @Get('config')
  @AuditLog('STOREFRONT_CONFIG_VIEW')
  async getConfig(@Query() query: TenantIdDto) {
    return this.storefrontService.getTenantConfig(query.tenantId);
  }

  @Get('products')
  @AuditLog('STOREFRONT_PRODUCT_LIST')
  async getProducts(@Query() query: ProductsQueryDto) {
    return this.storefrontService.getProducts(query);
  }

  @Get('products/:slug')
  @AuditLog({ action: 'STOREFRONT_PRODUCT_VIEW', entityType: 'product' })
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.storefrontService.getProductBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Get('home')
  @AuditLog('STOREFRONT_HOME_VIEW')
  async getHome(@Query() query: TenantIdDto) {
    return this.storefrontService.getHomeData(query.tenantId);
  }

  @Post('newsletter')
  @AuditLog('STOREFRONT_NEWSLETTER_SUBSCRIBE')
  @RateLimit({ requests: 5, windowMs: 3600000 }) // S6: Limit to 5 per hour
  async subscribe(@Body() body: NewsletterSubscriptionDto) {
    return this.storefrontService.subscribeToNewsletter(body.email);
  }
}
