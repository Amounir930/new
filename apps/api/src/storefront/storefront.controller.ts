import { AuditLog } from '@apex/audit';
import {
  BadRequestException,
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
import {
  isUuid,
  RateLimit,
  TenantCacheService,
  type TenantRequest,
} from '@apex/middleware';

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
  constructor(
    private readonly storefrontService: StorefrontService,
    private readonly tenantCache: TenantCacheService
  ) {}

  @Get('config')
  @AuditLog('STOREFRONT_CONFIG_VIEW')
  async getConfig(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(req, query.tenantId);
    return this.storefrontService.getTenantConfig(tenantId, schemaName);
  }

  @Get('products')
  @AuditLog('STOREFRONT_PRODUCT_LIST')
  async getProducts(
    @Req() req: TenantRequest,
    @Query() query: ProductsQueryDto,
    @Query() tenantQuery: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(req, tenantQuery.tenantId);
    return this.storefrontService.getProducts(tenantId, schemaName, query);
  }

  @Get('products/:slug')
  @AuditLog({ action: 'STOREFRONT_PRODUCT_VIEW', entityType: 'product' })
  async getProductBySlug(
    @Req() req: TenantRequest,
    @Param('slug') slug: string,
    @Query() query: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(req, query.tenantId);
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
    const { tenantId, schemaName } = await this.resolveStorefrontContext(req, query.tenantId);
    return this.storefrontService.getHomeData(tenantId, schemaName);
  }

  @Get('bootstrap')
  async getBootstrap(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(req, query.tenantId);
    return this.storefrontService.getBootstrapData(tenantId, schemaName);
  }

  /**
   * 🛡️ Sovereign Translation Helper
   * Trace: Identifies if request is on a shared domain (system) and resolves the peer tenant.
   * Logic: Prioritizes explicit queryId over ambient 'system' context to prevent short-circuit traps.
   */
  private async resolveStorefrontContext(req: TenantRequest, queryId?: string) {
    const ambientId = req.tenantContext?.tenantId;
    
    // S2 Protocol: If we are on a system/shared domain, we MUST use the queryId.
    // If we are on a dedicated tenant domain, ambientId is already the UUID.
    const rawId = (ambientId === 'system' || !ambientId) ? queryId : ambientId;

    if (!rawId || rawId === 'system') {
      throw new BadRequestException('MANDATORY: Tenant identifier (subdomain or UUID) is required on shared domains');
    }

    // Attempt resolution through Smart Cache (handles ID and Subdomain)
    const context = await this.tenantCache.resolveTenant(rawId);

    if (!context || !isUuid(context.tenantId)) {
      throw new BadRequestException(`S2 Failure: Tenant resolution failed for identifier ${rawId}`);
    }

    // Set audit ID for forensic traceability
    (req as any).auditTenantId = context.tenantId;

    return {
      tenantId: context.tenantId,
      schemaName: context.schemaName
    };
  }

  @Post('newsletter')
  @AuditLog('STOREFRONT_NEWSLETTER_SUBSCRIBE')
  @RateLimit({ requests: 5, windowMs: 3600000 }) // S6: Limit to 5 per hour
  async subscribe(
    @Req() req: TenantRequest,
    @Body() body: NewsletterSubscriptionDto,
    @Query() query: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(req, query.tenantId);
    return this.storefrontService.subscribeToNewsletter(tenantId, schemaName, body.email);
  }
}
