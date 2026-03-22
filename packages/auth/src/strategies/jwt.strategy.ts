import { ConfigService } from '@apex/config';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(@Inject(ConfigService) configService: ConfigService) {
    if (!configService) {
      throw new Error('ConfigService is missing in JwtStrategy constructor');
    }
    // S1 FIX 3A: JWT_SECRET is MANDATORY. No fallback allowed.
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
          let token = null;
          if (req?.cookies && typeof req.cookies === 'object') {
            token = (req.cookies as Record<string, string | undefined>).adm_tkn;
          }
          return token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // S7: Sanitize logs (No full payload logging as per Military Directive)
    this.logger.log(
      `[AUTH-DEBUG] Auth attempt: Sub=${payload.sub}, Role=${payload.role}, Tenant=${payload.tenantId}`
    );

    // Item 21: Enforce mandatory tenantId in JWT
    if (!payload?.sub || !payload?.tenantId) {
      throw new UnauthorizedException(
        'S2 Violation: Invalid token payload (missing sub or tenantId)'
      );
    }

    // Sovereign & Merchant Bypass: Trust the cryptographically signed tenantId in the JWT
    // Item 21 Compliance: tenantId is verified during login/provisioning
    // Performance Mandate: Direct O(1) validation, no DB JOIN for every request.
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
