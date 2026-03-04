/**
 * Authentication module exports
 * @module @apex/auth
 */

import { getCurrentTenantContext, type TenantContext } from '@apex/middleware';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { AuthUser } from './auth.service.js';

export * from './auth.module.js';
export * from './auth.service.js';
export * from './decorators/current-user.decorator.js';
export * from './decorators/public.decorator.js';
export * from './guards/super-admin.guard.js';
export * from './guards/tenant-jwt-match.guard.js';
export * from './strategies/jwt.strategy.js';
export type { TenantContext };

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  tenantContext?: TenantContext;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom logic here if needed
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false
  ): TUser {
    if (err || !user) {
      // S5 FIX: ALWAYS throw UnauthorizedException (401), never raw Error (500).
      // Passport can pass JsonWebTokenError, TokenExpiredError, etc.
      // The GlobalExceptionFilter only recognizes HttpException subclasses.
      const message = err?.message || 'Authentication required';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}

export { getCurrentTenantContext };
