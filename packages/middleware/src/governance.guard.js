/**
 * Governance Guard
 *
 * Enforces feature-level access control based on plan and tenant specific gates.
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
import { governanceService } from '@apex/db';
import { ForbiddenException, Injectable, SetMetadata, } from '@nestjs/common';
export const FEATURE_KEY = 'governance_feature';
/**
 * Decorator to require a specific feature for a route.
 * Usage: @RequireFeature('ai_personalization')
 */
export const RequireFeature = (feature) => SetMetadata(FEATURE_KEY, feature);
let GovernanceGuard = class GovernanceGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    async canActivate(context) {
        const feature = this.reflector.get(FEATURE_KEY, context.getHandler());
        // If no feature is required, allow access
        if (!feature) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = request.tenantContext?.tenantId;
        // Super Admin Bypass
        if (user?.role === 'super_admin') {
            return true;
        }
        if (!tenantId) {
            throw new ForbiddenException('Tenant context required for feature validation');
        }
        const isEnabled = await governanceService.isFeatureEnabled(tenantId, feature);
        if (!isEnabled) {
            throw new ForbiddenException(`Feature '${feature}' is not enabled for your current plan.`);
        }
        return true;
    }
};
GovernanceGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Function])
], GovernanceGuard);
export { GovernanceGuard };
//# sourceMappingURL=governance.guard.js.map