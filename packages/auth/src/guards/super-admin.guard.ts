import { env } from '@apex/config';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // S1/S7 Mandate: X-Super-Admin-Key Enforcement (Sovereign Shield)
    const adminKey = request.headers['x-super-admin-key'];
    if (!adminKey || adminKey !== env.SUPER_ADMIN_KEY) {
      throw new ForbiddenException(
        'Sovereign Shield: Valid X-Super-Admin-Key header required'
      );
    }

    const user = (request as Request & { user?: { role?: string } }).user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Role check: must be 'super_admin'
    if (user.role !== 'super_admin') {
      throw new UnauthorizedException('Super Admin access required');
    }

    return true;
  }
}
