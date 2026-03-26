import { AuditLog } from '@apex/audit';
import {
  isUuid,
  RateLimit,
  TenantCacheService,
  type TenantRequest,
} from '@apex/middleware';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
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
  constructor(
    private readonly storefrontService: StorefrontService,
    @Inject('TENANT_CACHE_SERVICE')
    private readonly tenantCache: TenantCacheService
  ) {}

  @Get('config')
  @AuditLog('STOREFRONT_CONFIG_VIEW')
  async getConfig(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );
    return this.storefrontService.getTenantConfig(tenantId, schemaName);
  }

  @Get('products')
  @AuditLog('STOREFRONT_PRODUCT_LIST')
  async getProducts(
    @Req() req: TenantRequest,
    @Query() query: ProductsQueryDto,
    @Query() tenantQuery: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      tenantQuery.tenantId
    );
    return this.storefrontService.getProducts(tenantId, schemaName, query);
  }

  @Get('products/:slug')
  @AuditLog({ action: 'STOREFRONT_PRODUCT_VIEW', entityType: 'product' })
  async getProductBySlug(
    @Req() req: TenantRequest,
    @Param('slug') slug: string,
    @Query() query: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );
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
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );
    return this.storefrontService.getHomeData(tenantId, schemaName);
  }

  @Get('bootstrap')
  async getBootstrap(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );
    return this.storefrontService.getBootstrapData(tenantId, schemaName);
  }

  /**
   * 🛡️ Sovereign Translation Helper
   * Trace: Identifies if request is on a shared domain (system) and resolves the peer tenant.
   * Logic: Prioritizes explicit queryId over ambient 'system' context to prevent short-circuit traps.
   */
  private async resolveStorefrontContext(req: TenantRequest, queryId?: string) {
    const ambientId = req.tenantContext?.tenantId;
    const headerId = req.headers['x-tenant-id'] as string;

    // S2 Protocol: Priority 1: Query string (?tenantId=)
    // Priority 2: Header (x-tenant-id)
    // Priority 3: Ambient context (from subdomain)
    // On shared domains ('system') or internal infrastructure calls, explicit overrides MUST take precedence.
    const rawId =
      ambientId === 'system' ||
      ambientId === '00000000-0000-0000-0000-000000000000' ||
      !ambientId
        ? queryId || headerId
        : ambientId || queryId || headerId;

    // S2 Protection: Reject generic/default identifiers which lack a real schema context.
    const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(rawId || '');
    if (
      !rawId ||
      rawId === 'system' ||
      rawId === 'public' ||
      isIP ||
      rawId === '127'
    ) {
      throw new BadRequestException(
        'MANDATORY: Valid tenant identifier (subdomain or UUID) is required'
      );
    }

    // Attempt resolution through Smart Cache (handles ID and Subdomain)
    const context = await this.tenantCache.resolveTenant(rawId);

    if (!context || !isUuid(context.tenantId)) {
      throw new BadRequestException(
        `S2 Failure: Tenant resolution failed for identifier ${rawId}`
      );
    }

    (req as unknown as Request & { auditTenantId?: string }).auditTenantId =
      context.tenantId;

    return {
      tenantId: context.tenantId,
      schemaName: context.schemaName,
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
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );
    return this.storefrontService.subscribeToNewsletter(
      tenantId,
      schemaName,
      body.email
    );
  }
}
