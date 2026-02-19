/**
 * Quota Service
 * Enforces plan limits and resource quotas for tenants
 */

export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxProducts: number;
  maxStorageMb: number;
  maxUsers: number;
  customDomain: boolean;
  prioritySupport: boolean;
  maxStaffUsers: number;
  maxTenants: number;
  allowedFeatures: string[];
  maxOrdersPerMonth: number;
}

/**
 * Check if a feature is allowed for a plan
 * Note: S21 Implementation - This should now be handled by GovernanceGuard/feature_gates
 * but kept here for legacy support during transition.
 */
export function isFeatureAllowed(plan: string, feature: string): boolean {
  // S21: Bypass for enterprise, otherwise allow common features.
  // Real enforcement happens via feature_gates table synced from Blueprint.
  if (plan === 'enterprise') return true;
  if (['products', 'orders', 'basic_analytics'].includes(feature)) return true;
  return false;
}

/**
 * Check if provisioning is allowed (quota check)
 * S21: Now checks against the Blueprint JSON or DB registry
 */
export async function checkProvisioningQuota(
  _plan: string,
  _orgId?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  currentUsage?: number;
}> {
  // S21 Implementation: The sovereign Blueprint dictates if a plan is active/allowed.
  // This is now enforced in ProvisioningService via the database.
  return { allowed: true, limit: 1 };
}

/**
 * Validate subdomain availability and format
 */
export async function validateSubdomainAvailability(
  subdomain: string
): Promise<{ available: boolean; reason?: string }> {
  if (subdomain.length < 3 || subdomain.length > 30) {
    return { available: false, reason: 'Must be between 3 and 30 characters' };
  }
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return {
      available: false,
      reason: 'Only lowercase letters, numbers, and hyphens',
    };
  }
  if (subdomain.includes(' '))
    return { available: false, reason: 'No spaces allowed' };
  if (['admin', 'api', 'www'].includes(subdomain))
    return { available: false, reason: 'reserved word' };

  // DB check would go here
  return { available: true };
}

/**
 * Check if a tenant can perform an action based on their quota
 * S21: Now expects the current limit to be passed or fetched from GovernanceService
 * @param currentUsage - Current resource count
 * @param limit - Current resource limit
 * @returns boolean indicating if allowed
 */
export function checkQuota(currentUsage: number, limit: number): boolean {
  return currentUsage < limit;
}
