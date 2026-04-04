import type { Request } from 'express';

/**
 * Customer user identity — attached to request.user by CustomerJwtAuthGuard.
 */
export interface CustomerUser {
  id: string;
  email: string;
  tenantId: string;
  subdomain: string;
  role: 'customer';
}

/**
 * CustomerAuthenticatedRequest — typed request for customer-authenticated endpoints.
 */
export interface CustomerAuthenticatedRequest extends Request {
  user: CustomerUser;
  tenantContext?: {
    tenantId: string;
    schemaName: string;
    subdomain: string;
  };
}

/**
 * Re-export guards from @apex/auth for use in controller decorators.
 */
export { CustomerJwtAuthGuard, CustomerJwtMatchGuard } from '@apex/auth';
