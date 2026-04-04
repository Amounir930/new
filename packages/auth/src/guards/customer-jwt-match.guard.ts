/**
 * Customer Tenant-JWT Match Guard
 *
 * Ensures the customer's JWT tenantId matches the request's tenant context.
 * Prevents a customer from store1.60sec.shop from accessing store2.60sec.shop data.
 */

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export interface CustomerTenantRequest extends Request {
  tenantContext?: {
    tenantId: string;
    schemaName: string;
    subdomain: string;
    [key: string]: unknown;
  };
  user?: {
    id: string;
    tenantId?: string;
    subdomain?: string;
    role?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class CustomerJwtMatchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CustomerTenantRequest>();

    // Skip if no authentication (handled by CustomerJwtAuthGuard)
    if (!request.user) {
      return true;
    }

    // Skip if no tenant context (should not happen on storefront routes)
    if (!request.tenantContext) {
      return true;
    }

    const jwtTenantId = request.user.tenantId;
    const contextTenantId = request.tenantContext?.tenantId;

    // If JWT has no tenantId, deny
    if (!jwtTenantId) {
      throw new UnauthorizedException('Customer token missing tenantId');
    }

    // If context has no tenantId, allow (public endpoint behavior)
    if (!contextTenantId) {
      return true;
    }

    // 🛡️ S2 FIX: When context is system/placeholder, trust JWT as authoritative source
    // The JWT tenantId was resolved server-side via TenantCacheService at login time
    // and is cryptographically signed — it overrides an ambiguous request context
    const isSystemContext =
      contextTenantId === 'system' ||
      contextTenantId === '00000000-0000-0000-0000-000000000000';

    if (isSystemContext) {
      const subdomain = request.user.subdomain;
      if (!subdomain) {
        throw new UnauthorizedException(
          'S2 Violation: Customer JWT missing subdomain for context resolution'
        );
      }

      request.tenantContext = {
        tenantId: jwtTenantId,
        schemaName: `tenant_${subdomain}_v2`,
        subdomain,
      };
      return true;
    }

    // CRITICAL: Validate JWT tenant matches request tenant
    if (jwtTenantId !== contextTenantId) {
      process.stdout.write(
        `[CUSTOMER-AUTH] S2 VIOLATION: Customer JWT tenant (${jwtTenantId}) doesn't match request tenant (${contextTenantId})\n`
      );
      throw new UnauthorizedException(
        'Access denied: your account belongs to a different store.'
      );
    }

    return true;
  }
}
