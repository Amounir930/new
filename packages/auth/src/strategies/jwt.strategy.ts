import { ConfigService } from '@apex/config';
// biome-ignore lint/style/useImportType: Dependency Injection
import { StaffService } from '@apex/db';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser, JwtPayload } from '../auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    private readonly staffService: StaffService
  ) {
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Item 21: Enforce mandatory tenantId in JWT
    if (!payload || !payload.sub || !payload.tenantId) {
      throw new UnauthorizedException(
        'S2 Violation: Invalid token payload (missing sub or tenantId)'
      );
    }

    // Item 26: Fingerprint check (if present in payload, it should be validated elsewhere or logged)
    // Item 28: DB Validation — Check if session is still valid
    if (payload.jti) {
      // For staff sessions, we check the DB
      // We assume payload.sub is the staffId or userId
      const session = await this.staffService.validateSession(
        payload.tenantId,
        payload.jti
      );
      if (!session) {
        throw new UnauthorizedException(
          'S2 Violation: Session has been revoked or expired'
        );
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
