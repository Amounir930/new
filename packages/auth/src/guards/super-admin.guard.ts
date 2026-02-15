import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const user = (request as any).user;

        if (!user) {
            throw new UnauthorizedException('Authentication required');
        }

        // Role check: must be 'super_admin'
        // Assuming the JWT payload contains a 'role' field
        if (user.role !== 'super_admin') {
            throw new UnauthorizedException('Super Admin access required');
        }

        return true;
    }
}
