/**
 * S2: Tenant-JWT Match Guard
 * Ensures JWT tenantId matches the request's tenant context
 * Prevents cross-tenant access using valid JWT from another tenant
 */

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export interface TenantRequest extends Request {
  tenantContext?: {
    tenantId: string;
    [key: string]: unknown;
  };
  user?: {
    id: string; // Item 28: Required for session verification
    tenantId?: string;
    role?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class TenantJwtMatchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    // Skip if no authentication (handled by JwtAuthGuard)
    if (!request.user) {
      return true;
    }

    // Skip if no tenant context (public endpoints)
    if (!request.tenantContext) {
      return true;
    }

    const jwtTenantId = request.user.tenantId;
    const contextTenantId = request.tenantContext.tenantId;

    // CRITICAL FIX (S2): Validate JWT tenant matches request tenant
    if (jwtTenantId && jwtTenantId !== contextTenantId) {
      console.error(
        `S2 VIOLATION: JWT tenant (${jwtTenantId}) doesn't match request tenant (${contextTenantId})`
      );
      throw new UnauthorizedException('Cross-tenant access denied');
    }

    return true;
  }
}
