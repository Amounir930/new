/**
 * Quota Interceptor
 *
 * Enforces resource-level quotas (max products, max orders, etc.)
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, SetMetadata, } from '@nestjs/common';
export const QUOTA_KEY = 'governance_quota';
/**
 * Decorator to check quota before operation.
 * Usage: @CheckQuota('products')
 */
export const CheckQuota = (resource) => SetMetadata(QUOTA_KEY, resource);
let QuotaInterceptor = class QuotaInterceptor {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    async intercept(context, next) {
        const resource = this.reflector.get(QUOTA_KEY, context.getHandler());
        if (!resource) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = request.tenantContext?.tenantId;
        // Super Admin Bypass
        if (user?.role === 'super_admin') {
            return next.handle();
        }
        if (!tenantId) {
            throw new ForbiddenException('Tenant context required for quota validation');
        }
        // This requires a count of current resources.
        // In a real scenario, we might pass a 'currentCount' via the request or fetch it here.
        // For now, we assume the controller or service will perform the final check,
        // or we fetch the count from the DB if provided in metadata.
        // Placeholder: The actual enforcement might happen in the service layer for better precision,
        // but the interceptor can pre-check based on cached counts if available.
        return next.handle();
    }
};
QuotaInterceptor = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Function])
], QuotaInterceptor);
export { QuotaInterceptor };
//# sourceMappingURL=quota.interceptor.js.map