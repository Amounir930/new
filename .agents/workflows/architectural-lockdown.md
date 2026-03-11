---
description: Architectural Lockdown - Logical Provisioning Fixes
---

// turbo-all

1. **Strict Plan Validation**
   - Remove default `plan = 'free'` in `packages/provisioning/src/storage-manager.ts` and other relevant files.
   - In `ProvisioningService.provision`, query `governance.subscription_plans` to validate `options.plan`.
   - Throw `400 Bad Request` if plan is invalid.

2. **Authentication Seeding Protocol**
   - Modify `CoreModule` to integrate with `AuthService`.
   - Create user in central Auth store -> obtain `user_id` -> insert into tenant's `staff_members`.
   - Ensure email encryption remains S7 compliant.

3. **Schema Parity & Feature Gating**
   - Ensure `BlueprintExecutor` populates `governance.tenant_quotas` and `governance.feature_gates` based on the blueprint definition.
   - Verify that logic (middleware/service) enforces these gates rather than physical schema differences.

4. **Blueprint Configuration API**
   - Implement an endpoint in `ProvisioningController` to return list of configurable tables from `schema.ts`.
   - Update Dashboard UI to consume this dynamic list.
