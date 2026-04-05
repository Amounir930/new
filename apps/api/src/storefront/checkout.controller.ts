import { AuditLog } from '@apex/audit';
import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import type { TenantCacheService, TenantRequest } from '@apex/middleware';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/checkout.dto';

/**
 * ── CHECKOUT CONTROLLER (Store-#06) ──
 * POST /api/v1/storefront/checkout/create
 *
 * Zero-Trust order creation endpoint.
 * Client sends cart items + address + shipping method.
 * Server recalculates ALL prices from DB before creating the order.
 */
@Controller({ path: 'storefront/checkout', version: '1' })
@UsePipes(ZodValidationPipe)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    @Inject('TENANT_CACHE_SERVICE')
    private readonly tenantCache: TenantCacheService
  ) { }

  @Post('create')
  @AuditLog({ action: 'STOREFRONT_CHECKOUT_CREATE', entityType: 'order' })
  async createCheckout(
    @Req() req: TenantRequest,
    @Body() dto: CreateCheckoutDto
  ) {
    // Resolve tenant context — priority: ambient > header
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    const tenantId = req.tenantContext?.tenantId ?? headerTenantId;

    if (
      !tenantId ||
      tenantId === 'system' ||
      tenantId === 'public' ||
      tenantId === '127'
    ) {
      throw new BadRequestException(
        'MANDATORY: Valid tenant identifier is required'
      );
    }

    // Resolve tenant schema via cache
    const context = await this.tenantCache.resolveTenant(tenantId);
    if (!context) {
      throw new BadRequestException(
        `S2 Failure: Tenant resolution failed for ${tenantId}`
      );
    }

    // Extract customer ID if authenticated
    const customerId = req.user?.id ?? null;

    // Extract session ID from cookie or header
    const sessionId =
      req.cookies?.sessionId ??
      (req.headers['x-session-id'] as string | undefined) ??
      null;
    const ipAddress = (req.ip ??
      req.headers['x-forwarded-for'] ??
      null) as string | null;
    const userAgent = (req.headers['user-agent'] as string | undefined) ?? null;

    // Create order (atomic, zero-trust)
    const result = await this.checkoutService.createOrder(
      context.tenantId,
      context.schemaName,
      dto,
      customerId,
      sessionId,
      ipAddress,
      userAgent
    );

    return {
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      total: result.total,
      subtotal: result.subtotal,
      shipping: result.shipping,
      tax: result.tax,
      items: result.items,
      ...(result.clientSecret ? { clientSecret: result.clientSecret } : {}),
    };
  }
}
