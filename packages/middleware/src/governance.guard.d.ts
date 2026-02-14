/**
 * Governance Guard
 *
 * Enforces feature-level access control based on plan and tenant specific gates.
 */
import { type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
export declare const FEATURE_KEY = "governance_feature";
/**
 * Decorator to require a specific feature for a route.
 * Usage: @RequireFeature('ai_personalization')
 */
export declare const RequireFeature: (feature: string) => import("@nestjs/common").CustomDecorator<string>;
export declare class GovernanceGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=governance.guard.d.ts.map