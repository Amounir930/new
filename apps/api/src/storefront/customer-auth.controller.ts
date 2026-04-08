import { AuditLog } from '@apex/audit';
import {
  type CustomerAuthenticatedRequest,
  CustomerAuthService,
  CustomerJwtAuthGuard,
  CustomerJwtMatchGuard,
  verifyOAuthState,
} from '@apex/auth';
import { ConfigService } from '@apex/config';
import { TenantCacheService } from '@apex/middleware';
import {
  calculateFraudRisk,
  extractEmailDomain,
  type FraudRiskResult,
} from '@apex/security';
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
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

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
@UsePipes(new ZodValidationPipe())
export class CustomerAuthController {
  private readonly logger = new Logger(CustomerAuthController.name);
  private readonly rootDomain: string;
  private readonly isProduction: boolean;
  private readonly appProtocol: string;

  constructor(
    private readonly customerAuthService: CustomerAuthService,
    @Inject(TenantCacheService)
    private readonly tenantCache: TenantCacheService,
    @Inject(ConfigService)
    private readonly config: ConfigService
  ) {
    // ✅ S1 Compliant: Use ConfigService instead of process.env
    this.rootDomain = this.config.getWithDefault(
      'APP_ROOT_DOMAIN',
      '60sec.shop'
    );
    this.isProduction =
      this.config.getWithDefault('NODE_ENV', 'development') === 'production';
    this.appProtocol = this.isProduction ? 'https' : 'http';
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
    const result = await this.customerAuthService.register(
      subdomain,
      parsed.data
    );

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

    // S14: Fraud risk assessment
    const riskResult = this.assessLoginRisk(req, parsed.data.email, false);
    if (riskResult.action === 'block') {
      this.logger.warn(
        `LOGIN_BLOCKED: High fraud risk (${riskResult.score}/100) for ${parsed.data.email} from ${req.ip}`
      );
      throw new BadRequestException(
        'Login attempt blocked due to suspicious activity'
      );
    }

    const subdomain = this.extractSubdomain(req);
    const result = await this.customerAuthService.login(subdomain, parsed.data);

    this.setCustomerCookie(response, result.token);

    return {
      success: true,
      customer: result.customer,
      ...(riskResult.action === 'challenge' && {
        requiresVerification: true,
        riskLevel: riskResult.level,
      }),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // POST /api/v1/storefront/auth/logout
  // ═══════════════════════════════════════════════════════════════
  @Post('logout')
  @UseGuards(CustomerJwtAuthGuard, CustomerJwtMatchGuard)
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'CUSTOMER_LOGOUT', entityType: 'customer' })
  async logout(
    @Req() req: CustomerAuthenticatedRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    this.clearCustomerCookie(response);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /api/v1/storefront/auth/me
  // ═══════════════════════════════════════════════════════════════
  @Get('me')
  @UseGuards(CustomerJwtAuthGuard, CustomerJwtMatchGuard)
  @AuditLog({ action: 'CUSTOMER_PROFILE_VIEW', entityType: 'customer' })
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
  // GET /api/v1/storefront/auth/google
  // ═══════════════════════════════════════════════════════════════
  @Get('google')
  @UseGuards(AuthGuard('google-customer'))
  async googleAuth() {
    // S2 COMPLIANT: This route initiates the Google OAuth2 flow.
    // The AuthGuard('google-customer') redirects to Google's consent page,
    // passing the signed state parameter through the OAuth URL.
    //
    // Security flow:
    // 1. Frontend calls POST /api/v1/storefront/auth/google/state → gets HMAC-signed state
    // 2. Frontend redirects to GET /api/v1/storefront/auth/google?state={signedToken}
    // 3. AuthGuard passes signed state to Google's OAuth URL
    // 4. Google redirects back to /google/callback with the same state
    // 5. GoogleCustomerStrategy verifies HMAC signature (verifyOAuthState)
    // 6. If signature invalid/expired → 401 Unauthorized
    //
    // Prevents tenant hijacking: attacker cannot forge signed state without JWT_SECRET.
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /api/v1/storefront/auth/google/callback
  // ═══════════════════════════════════════════════════════════════
  @Get('google/callback')
  @UseGuards(AuthGuard('google-customer'))
  @AuditLog({ action: 'CUSTOMER_GOOGLE_LOGIN', entityType: 'customer' })
  async googleAuthCallback(
    @Req() req: Request & {
      user?: {
        googleId: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        emailVerified: boolean;
        tenantSubdomain: string;
      };
    },
    @Res({ passthrough: true }) response: Response
  ) {
    if (!req.user) {
      throw new BadRequestException('Google authentication failed');
    }

    const result = await this.customerAuthService.googleLogin(req.user);

    this.setCustomerCookie(response, result.token);

    // Redirect to the storefront account page with a success flag
    // ✅ Security: Use config-based protocol and domain (no hardcoded values)
    const baseUrl = `${this.appProtocol}://${req.user.tenantSubdomain}.${this.rootDomain}`;
    const redirectUrl = result.isNew
      ? `${baseUrl}/account?google=new`
      : `${baseUrl}/account`;

    response.redirect(redirectUrl);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private setCustomerCookie(response: Response, token: string) {
    response.cookie('cst_tkn', token, {
      httpOnly: true,
      secure: this.isProduction, // ✅ S1 Compliant: Use config-based value
      sameSite: 'lax',
      domain: `.${this.rootDomain}`, // ✅ S1 Compliant: Use config-based value
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearCustomerCookie(response: Response) {
    response.cookie('cst_tkn', '', {
      httpOnly: true,
      secure: this.isProduction, // ✅ S1 Compliant: Use config-based value
      sameSite: 'lax',
      domain: `.${this.rootDomain}`, // ✅ S1 Compliant: Use config-based value
      path: '/',
      maxAge: 0,
    });
  }

  private extractSubdomain(req: Request): string {
    // Priority 1: x-tenant-id header (sent by storefront frontend)
    const headerTenant = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenant) return headerTenant;

    // Priority 2: Fallback to Host-based extraction
    const host = (req.headers.host || '').split(':')[0];
    const parts = host.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // Reject system/infrastructure subdomains — they are never tenant stores
      const systemSubdomains = [
        'api',
        'admin',
        'www',
        'super-admin',
        'staging',
      ];
      if (!systemSubdomains.includes(subdomain.toLowerCase())) {
        return subdomain;
      }
    }

    throw new BadRequestException(
      'Unable to determine store context. Provide x-tenant-id header or access from a tenant subdomain.'
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

  /**
   * S14: Assess fraud risk for a login attempt
   */
  private assessLoginRisk(
    req: Request,
    email: string,
    isOAuth: boolean
  ): FraudRiskResult {
    const emailDomain = extractEmailDomain(email);
    const userAgent = req.headers['user-agent'] as string | undefined;

    // Note: In production, these would be fetched from Redis/analytics
    // For now, we use conservative defaults based on available signals
    return calculateFraudRisk({
      ip: req.ip,
      userAgent,
      emailDomain,
      isOAuth,
      recentFailures: 0, // Would be tracked via Redis
      isKnownIP: true, // Would be checked against customer history
      hoursSinceLastLogin: null, // Would be fetched from DB
      isUnusualGeography: false, // Would use IP geolocation
    });
  }
}
