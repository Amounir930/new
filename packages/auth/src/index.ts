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
import type { Observable } from 'rxjs';

export * from './auth.module.js';
export * from './auth.service.js';
export * from './decorators/current-user.decorator.js';
export * from './decorators/public.decorator.js';
export * from './guards/super-admin.guard.js';
export * from './guards/tenant-jwt-match.guard.js';
export * from './strategies/jwt.strategy.js';
export type { TenantContext };

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
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

export { getCurrentTenantContext };
