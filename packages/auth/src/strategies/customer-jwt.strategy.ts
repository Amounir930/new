import { ConfigService } from '@apex/config/service';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Customer JWT payload — distinct from merchant/admin JWT.
 * Customers are scoped to a single tenant's storefront schema.
 */
export interface CustomerJwtPayload {
  sub: string;          // customerId (UUID in storefront.customers)
  email: string;        // plaintext email (for display only)
  tenantId: string;     // which tenant this customer belongs to
  subdomain: string;    // tenant subdomain (for schema resolution)
  role: 'customer';     // always 'customer'
  jti: string;          // replay protection
}

/**
 * Resolved customer identity — passed to request.user by the guard.
 */
export interface CustomerUser {
  id: string;
  email: string;
  tenantId: string;
  subdomain: string;
  role: 'customer';
}

/**
 * CustomerJwtStrategy — extracts `cst_tkn` cookie and validates the JWT.
 *
 * Unlike the merchant JwtStrategy (which queries governance.users),
 * this strategy is stateless: it trusts the cryptographically signed JWT
 * and passes the payload through. Tenant-scoped data access is enforced
 * downstream by CustomerJwtMatchGuard + schema-per-tenant isolation.
 */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  private readonly logger = new Logger(CustomerJwtStrategy.name);

  constructor(@Inject(ConfigService) configService: ConfigService) {
    if (!configService) {
      throw new Error('ConfigService is missing in CustomerJwtStrategy constructor');
    }

    const jwtSecret = configService.get('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        'S1 Violation: JWT_SECRET environment variable is required. Application cannot start.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request & { cookies?: Record<string, unknown> }) => {
          let token: string | null = null;
          if (req?.cookies && typeof req.cookies === 'object') {
            token = (req.cookies as Record<string, string | undefined>).cst_tkn ?? null;
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: CustomerJwtPayload): Promise<CustomerUser> {
    this.logger.log(
      `[CUSTOMER-AUTH-DEBUG] Customer auth attempt: id=${payload.sub}, tenant=${payload.tenantId}, subdomain=${payload.subdomain}`
    );

    if (!payload?.sub || !payload?.tenantId || payload?.role !== 'customer') {
      throw new UnauthorizedException(
        'S2 Violation: Invalid customer token payload'
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      subdomain: payload.subdomain,
      role: 'customer',
    };
  }
}
