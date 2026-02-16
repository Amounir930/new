# Frontend Integration Fix Plan (401 & 404)

## Goal Description
Resolve persistent 401 Unauthorized and 404 Not Found errors on the Admin Frontend.
1.  **401 Fix**: Ensure JWT Token includes the `role` claim required by `SuperAdminGuard`.
2.  **404 Fix**: Implement the missing `TenantsController` to handle `/super-admin/tenants`.

## User Review Required
> [!IMPORTANT]
> The 401 error is caused by `JwtStrategy` stripping the `role` claim. This fix is critical for all admin access.
> The 404 error confirms that `TenantsController` does not exist. We must create it.

## Proposed Changes

### 1. Authentication (Packages/Auth)
#### [MODIFY] [jwt.strategy.ts](file:///C:/Users/Dell/Desktop/60sec.shop/packages/auth/src/strategies/jwt.strategy.ts)
- Update `validate` method to include `role: payload.role` in the returned `AuthUser` object.

### 2. Tenant Management (Apps/API)
#### [NEW] [tenants.controller.ts](file:///C:/Users/Dell/Desktop/60sec.shop/apps/api/src/tenants/tenants.controller.ts)
- Create a new controller mapped to `admin/tenants`.
- Implement `findAll` endpoint using `TenantRegistryService`.
- Use `SuperAdminGuard`.

#### [MODIFY] [tenants.module.ts](file:///C:/Users/Dell/Desktop/60sec.shop/apps/api/src/tenants/tenants.module.ts)
- Create module to bundle the controller.

#### [MODIFY] [app.module.ts](file:///C:/Users/Dell/Desktop/60sec.shop/apps/api/src/app.module.ts)
- Register `TenantsModule`.

## Verification Plan
1.  **Local Test**: Run `jwt.strategy.test.ts` (if exists) or create a new test.
2.  **Deploy**: Push changes and deploy to production.
3.  **Manual Verify**:
    - Login (401 check).
    - Access Blueprints (401 check).
    - Access Tenants (404 check).
