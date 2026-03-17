import { ConfigService } from '@apex/config';
import { eq, getTenantDb, staffSessionsInStorefront } from '@apex/db';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser, JwtPayload } from '../auth.service';

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
    // Item 21: Enforce mandatory tenantId in JWT
    if (!payload?.sub || !payload?.tenantId) {
      throw new UnauthorizedException(
        'S2 Violation: Invalid token payload (missing sub or tenantId)'
      );
    }

    // Item 28: DB Validation — Check if session is still valid
    // Skip this check for super_admin and tenant_admin as they are managed centrally
    if (payload.jti && !['super_admin', 'tenant_admin'].includes(payload.role as string)) {
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
