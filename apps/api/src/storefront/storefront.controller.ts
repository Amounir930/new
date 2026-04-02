import { AuditLog } from '@apex/audit';
import { cartsInStorefront, eq, getTenantDb } from '@apex/db';
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
import type {
  AddToCartDto,
  CartSyncDto,
  RemoveCartItemDto,
  StockCheckDto,
} from './dto/cart.dto';
import type { NewsletterSubscriptionDto } from './dto/newsletter.dto';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import {
  type ProductWithVariants,
  type RelatedProduct,
  StorefrontService,
} from './storefront.service';

const TenantIdSchema = z.object({
  tenantId: z.string().optional(),
});

type TenantIdDto = z.infer<typeof TenantIdSchema>;

const ProductsQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
});

type ProductsQueryDto = z.infer<typeof ProductsQuerySchema>;

const ReviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

type ReviewsQueryDto = z.infer<typeof ReviewsQuerySchema>;

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

  @Get('products/:id/related')
  @AuditLog({ action: 'STOREFRONT_RELATED_PRODUCTS', entityType: 'product' })
  async getRelatedProducts(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Query() query: TenantIdDto,
    @Query('limit') limit?: number
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );

    if (!isUuid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    return this.storefrontService.getRelatedProducts(
      tenantId,
      schemaName,
      id,
      limit || 8
    );
  }

  @Get('products/:id/reviews')
  @AuditLog({ action: 'STOREFRONT_PRODUCT_REVIEWS', entityType: 'product' })
  async getProductReviews(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Query() query: TenantIdDto,
    @Query() reviewsQuery: ReviewsQueryDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );

    if (!isUuid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    return this.storefrontService.getProductReviews(
      tenantId,
      schemaName,
      id,
      reviewsQuery.page,
      reviewsQuery.limit
    );
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

  // ═══════════════════════════════════════════════════════════════
  // CART OPERATIONS (Zero-Trust Pricing)
  // ═══════════════════════════════════════════════════════════════

  @Post('cart/add')
  @RateLimit({ requests: 5, windowMs: 60000 }) // 5 req/min - human threshold
  @AuditLog('CART_ADD_ITEM')
  async addToCart(
    @Req() req: TenantRequest,
    @Body() body: AddToCartDto,
    @Query() query: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );

    const sessionId = this.getSessionId(req);

    return this.storefrontService.addToCart(
      tenantId,
      schemaName,
      body,
      sessionId
    );
  }

  @Post('cart/sync')
  @RateLimit({ requests: 10, windowMs: 60000 }) // 10 req/min
  @AuditLog('CART_SYNC')
  async syncCart(
    @Req() req: TenantRequest,
    @Body() body: CartSyncDto,
    @Query() query: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );

    const sessionId = this.getSessionId(req);

    return this.storefrontService.syncCart(
      tenantId,
      schemaName,
      body,
      sessionId
    );
  }

  @Post('cart/remove')
  @RateLimit({ requests: 10, windowMs: 60000 }) // 10 req/min
  @AuditLog('CART_REMOVE_ITEM')
  async removeFromCart(
    @Req() req: TenantRequest,
    @Body() body: RemoveCartItemDto,
    @Query() query: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );

    const sessionId = this.getSessionId(req);

    return this.storefrontService.removeFromCart(
      tenantId,
      schemaName,
      body.productId,
      body.variantId,
      sessionId
    );
  }

  @Post('cart/stock-check')
  @RateLimit({ requests: 20, windowMs: 60000 }) // 20 req/min
  @AuditLog('CART_STOCK_CHECK')
  async checkStock(
    @Req() req: TenantRequest,
    @Body() body: StockCheckDto,
    @Query() query: TenantIdDto
  ) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );

    return this.storefrontService.checkStock(tenantId, schemaName, body);
  }

  @Get('cart')
  @AuditLog('CART_VIEW')
  async getCart(@Req() req: TenantRequest, @Query() query: TenantIdDto) {
    const { tenantId, schemaName } = await this.resolveStorefrontContext(
      req,
      query.tenantId
    );

    const sessionId = this.getSessionId(req);

    const { db, release } = await getTenantDb(tenantId, schemaName);

    try {
      const cart = await db
        .select()
        .from(cartsInStorefront)
        .where(eq(cartsInStorefront.sessionId, sessionId))
        .limit(1);

      if (!cart.length) {
        return {
          items: [],
          subtotal: '0',
          itemCount: 0,
          updatedAt: new Date().toISOString(),
        };
      }

      const items = (cart[0].items || []) as any[];

      return {
        items,
        subtotal: cart[0].subtotal || '0',
        itemCount: items.length,
        lastSyncedAt: cart[0].updatedAt || new Date().toISOString(),
      };
    } finally {
      release();
    }
  }

  /**
   * 🛡️ Sovereign Translation Helper
   * Trace: Identifies if request is on a shared domain (system) and resolves the peer tenant.
   * Logic: Prioritizes explicit queryId over ambient 'system' context to prevent short-circuit traps.
   */
  private async resolveStorefrontContext(req: TenantRequest, queryId?: string) {
    const ambientId = req.tenantContext?.tenantId;
    const headerId = req.headers['x-tenant-id'] as string;

    const rawId =
      ambientId === 'system' ||
      ambientId === '00000000-0000-0000-0000-000000000000' ||
      !ambientId
        ? queryId || headerId
        : ambientId || queryId || headerId;

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

  /**
   * Extract session ID from request (cookie or header)
   * Used for cart association
   */
  private getSessionId(req: TenantRequest): string {
    // Try header first
    const headerSessionId = req.headers['x-session-id'] as string | undefined;
    if (headerSessionId) {
      return headerSessionId;
    }

    // Try cookie
    const cookieSessionId = req.cookies?.sessionId as string | undefined;
    if (cookieSessionId) {
      return cookieSessionId;
    }

    // Generate new session ID if not present
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return newSessionId;
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
