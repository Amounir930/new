/**
 * Quota Interceptor
 *
 * Enforces resource-level quotas (max products, max orders, etc.)
 */
import { type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
export declare const QUOTA_KEY = "governance_quota";
/**
 * Decorator to check quota before operation.
 * Usage: @CheckQuota('products')
 */
export declare const CheckQuota: (resource: "products" | "orders" | "pages") => import("@nestjs/common").CustomDecorator<string>;
export declare class QuotaInterceptor implements NestInterceptor {
    private reflector;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
//# sourceMappingURL=quota.interceptor.d.ts.map