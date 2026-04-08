import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';
import type { CustomerUser } from '../strategies/customer-jwt.strategy';

/**
 * CustomerJwtAuthGuard — activates the 'customer-jwt' Passport strategy.
 *
 * Usage:
 *   @UseGuards(CustomerJwtAuthGuard)
 *   async someEndpoint(@Req() req: CustomerAuthenticatedRequest) { ... }
 */
@Injectable()
export class CustomerJwtAuthGuard
  extends AuthGuard('customer-jwt')
  implements CanActivate
{
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = CustomerUser>(
    err: Error | null,
    user: TUser | false
  ): TUser {
    if (err || !user) {
      const message = err?.message || 'Customer authentication required';
      throw new UnauthorizedException(message);
    }
    // Type assertion is safe here: Passport strategy guarantees TUser matches the validated user
    return user as TUser;
  }
}

/**
 * CustomerAuthenticatedRequest — typed request interface for customer-authenticated endpoints.
 */
export interface CustomerAuthenticatedRequest extends Request {
  user: CustomerUser;
  tenantContext?: {
    tenantId: string;
    schemaName: string;
    subdomain: string;
  };
}
