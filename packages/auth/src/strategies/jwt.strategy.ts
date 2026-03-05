import { ConfigService } from '@apex/config';
import { eq, getTenantDb, staffSessionsInStorefront } from '@apex/db';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser, JwtPayload } from '../auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
        (req: any) => {
          let token = null;
          if (req?.cookies) {
            token = req.cookies.adm_tkn;
          }
          return token;
        },
      ]),
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

    // Item 28: DB Validation — Check if session is still valid
    if (payload.jti) {
      // For staff sessions, we check the DB directly using admin connection scoped to tenant
      const { db, release } = await getTenantDb(payload.tenantId);
      try {
        const [session] = await db
          .select({ id: staffSessionsInStorefront.id })
          .from(staffSessionsInStorefront)
          .where(eq(staffSessionsInStorefront.id, payload.jti))
          .limit(1);

        if (!session) {
          throw new UnauthorizedException(
            'S2 Violation: Session has been revoked or expired'
          );
        }
      } finally {
        release();
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
