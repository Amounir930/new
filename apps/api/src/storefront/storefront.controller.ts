import { AuditLog } from '@apex/audit';
import type { TenantRequest } from '@apex/middleware';
import { RateLimit } from '@apex/middleware';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import type { NewsletterSubscriptionDto } from './dto/newsletter.dto';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { StorefrontService } from './storefront.service';

const TenantIdSchema = z.object({
  tenantId: z.string().optional(),
});

type TenantIdDto = z.infer<typeof TenantIdSchema>;

const ProductsQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(), // S2 FIX 22C: Hard ceiling prevents OOM
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
});

type ProductsQueryDto = z.infer<typeof ProductsQuerySchema>;

@Controller({ path: 'storefront', version: '1' })
@UsePipes(ZodValidationPipe)
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('config')
  @AuditLog('STOREFRONT_CONFIG_VIEW')
  async getConfig(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const tenantId = req.tenantContext?.tenantId || query.tenantId || 'public';
    const schemaName = req.tenantContext?.schemaName || 'public';
    return this.storefrontService.getTenantConfig(tenantId, schemaName);
  }

  @Get('products')
  @AuditLog('STOREFRONT_PRODUCT_LIST')
  async getProducts(
    @Req() req: TenantRequest,
    @Query() query: ProductsQueryDto,
    @Query() tenantQuery: TenantIdDto
  ) {
    const tenantId =
      req.tenantContext?.tenantId || tenantQuery.tenantId || 'public';
    const schemaName = req.tenantContext?.schemaName || 'public';
    return this.storefrontService.getProducts(tenantId, schemaName, query);
  }

  @Get('products/:slug')
  @AuditLog({ action: 'STOREFRONT_PRODUCT_VIEW', entityType: 'product' })
  async getProductBySlug(
    @Req() req: TenantRequest,
    @Param('slug') slug: string,
    @Query() query: TenantIdDto
  ) {
    const tenantId = req.tenantContext?.tenantId || query.tenantId || 'public';
    const schemaName = req.tenantContext?.schemaName || 'public';
    const product = await this.storefrontService.getProductBySlug(
      tenantId,
      schemaName,
      slug
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Get('home')
  @AuditLog('STOREFRONT_HOME_VIEW')
  async getHome(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const tenantId = req.tenantContext?.tenantId || query.tenantId || 'public';
    const schemaName = req.tenantContext?.schemaName || 'public';
    return this.storefrontService.getHomeData(tenantId, schemaName);
  }

  @Get('bootstrap')
  async getBootstrap(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const tenantId = req.tenantContext?.tenantId || query.tenantId || 'public';
    const schemaName = req.tenantContext?.schemaName || 'public';
    return this.storefrontService.getBootstrapData(tenantId, schemaName);
  }

  @Post('newsletter')
  @AuditLog('STOREFRONT_NEWSLETTER_SUBSCRIBE')
  @RateLimit({ requests: 5, windowMs: 3600000 }) // S6: Limit to 5 per hour
  async subscribe(
    @Req() req: TenantRequest,
    @Body() body: NewsletterSubscriptionDto,
    @Query() query: TenantIdDto
  ) {
    const tenantId = req.tenantContext?.tenantId || query.tenantId || 'public';
    const schemaName = req.tenantContext?.schemaName || 'public';
    return this.storefrontService.subscribeToNewsletter(tenantId, schemaName, body.email);
  }
}
