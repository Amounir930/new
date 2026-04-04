import { AuditLog } from '@apex/audit';
import { TenantCacheService } from '@apex/middleware';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  CustomerAuthService,
  CustomerJwtAuthGuard,
  CustomerJwtMatchGuard,
  type CustomerAuthenticatedRequest,
} from '@apex/auth';

// ═══════════════════════════════════════════════════════════════
// ZOD SCHEMAS
// ═══════════════════════════════════════════════════════════════

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name cannot exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name cannot exceed 100 characters'),
  phone: z.string().max(20).optional(),
  acceptsMarketing: z.boolean().default(false),
});

const MergeCartSchema = z.object({
  sessionCartId: z.string().max(64).optional(),
});

interface ParsedTenantContext {
  tenantId: string;
  schemaName: string;
  subdomain: string;
}

@Controller({ path: 'storefront/auth', version: '1' })
export class CustomerAuthController {
  private readonly logger = new Logger(CustomerAuthController.name);
  private readonly rootDomain: string;

  constructor(
    private readonly customerAuthService: CustomerAuthService,
    @Inject(TenantCacheService)
    private readonly tenantCache: TenantCacheService
  ) {
    this.rootDomain = process.env.APP_ROOT_DOMAIN || '60sec.shop';
  }

  // ═══════════════════════════════════════════════════════════════
  // POST /api/v1/storefront/auth/register
  // ═══════════════════════════════════════════════════════════════
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({ action: 'CUSTOMER_REGISTERED', entityType: 'customer' })
  async register(
    @Req() req: Request,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response
  ) {
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.errors,
      });
    }

    const subdomain = this.extractSubdomain(req);
    const result = await this.customerAuthService.register(subdomain, parsed.data);

    this.setCustomerCookie(response, result.token);

    return { success: true, customer: result.customer };
  }

  // ═══════════════════════════════════════════════════════════════
  // POST /api/v1/storefront/auth/login
  // ═══════════════════════════════════════════════════════════════
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'CUSTOMER_LOGIN', entityType: 'customer' })
  async login(
    @Req() req: Request,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response
  ) {
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.errors,
      });
    }

    const subdomain = this.extractSubdomain(req);
    const result = await this.customerAuthService.login(subdomain, parsed.data);

    this.setCustomerCookie(response, result.token);

    return { success: true, customer: result.customer };
  }

  // ═══════════════════════════════════════════════════════════════
  // POST /api/v1/storefront/auth/logout
  // ═══════════════════════════════════════════════════════════════
  @Post('logout')
  @UseGuards(CustomerJwtAuthGuard, CustomerJwtMatchGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: CustomerAuthenticatedRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    this.clearCustomerCookie(response);
    this.logger.log(
      `CUSTOMER_LOGOUT: id=${req.user.id}, tenant=${req.user.subdomain}`
    );
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /api/v1/storefront/auth/me
  // ═══════════════════════════════════════════════════════════════
  @Get('me')
  @UseGuards(CustomerJwtAuthGuard, CustomerJwtMatchGuard)
  async getMe(@Req() req: CustomerAuthenticatedRequest) {
    const ctx = await this.resolveTenantContext(req.user.subdomain);
    if (!ctx) throw new NotFoundException('Store context not found');

    const customer = await this.customerAuthService.getMe(
      req.user.id,
      ctx.tenantId,
      ctx.schemaName
    );

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  // ═══════════════════════════════════════════════════════════════
  // POST /api/v1/storefront/auth/cart/merge
  // ═══════════════════════════════════════════════════════════════
  @Post('cart/merge')
  @UseGuards(CustomerJwtAuthGuard, CustomerJwtMatchGuard)
  @HttpCode(HttpStatus.OK)
  async mergeCart(
    @Req() req: CustomerAuthenticatedRequest,
    @Body() body: unknown
  ) {
    const parsed = MergeCartSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.errors,
      });
    }

    const ctx = await this.resolveTenantContext(req.user.subdomain);
    if (!ctx) throw new NotFoundException('Store context not found');

    await this.customerAuthService.mergeCart(
      req.user.id,
      ctx.tenantId,
      ctx.schemaName,
      parsed.data.sessionCartId
    );

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private setCustomerCookie(response: Response, token: string) {
    response.cookie('cst_tkn', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: `.${this.rootDomain}`,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearCustomerCookie(response: Response) {
    response.cookie('cst_tkn', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: `.${this.rootDomain}`,
      path: '/',
      maxAge: 0,
    });
  }

  private extractSubdomain(req: Request): string {
    const host = (req.headers.host || '').split(':')[0];
    const parts = host.split('.');

    if (parts.length >= 3) return parts[0];

    const headerTenant = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenant) return headerTenant;

    throw new BadRequestException(
      'Unable to determine store context from request'
    );
  }

  private async resolveTenantContext(
    subdomain: string
  ): Promise<ParsedTenantContext | null> {
    const context = await this.tenantCache.resolveTenant(subdomain);
    if (!context) return null;
    return {
      tenantId: context.tenantId,
      schemaName: context.schemaName,
      subdomain: context.subdomain,
    };
  }
}
