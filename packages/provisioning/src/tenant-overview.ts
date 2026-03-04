/**
 * Super-#01: Tenant Overview Table
 * Constitution Reference: plan.md (Super-#01)
 * Purpose: Super Admin page showing searchable table of all tenants
 */

import {
  adminDb,
  and,
  asc,
  count,
  desc,
  eq,
  sql,
  tenantsInGovernance,
} from '@apex/db';

export type Tenant = typeof tenantsInGovernance.$inferSelect;

export type TenantStatus = 'active' | 'suspended' | 'archived';
export type TenantPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface TenantOverviewRecord {
  id: string;
  subdomain: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (populated via joins or separate queries)
  stats?: {
    productCount?: number;
    orderCount?: number;
    userCount?: number;
    storageUsed?: number; // in MB
    lastActivityAt?: Date;
  };
}

export interface TenantListOptions {
  // Pagination
  page?: number;
  limit?: number;
  // Search
  search?: string;
  // Filters
  status?: TenantStatus;
  plan?: TenantPlan;
  // Sorting
  sortBy?: 'createdAt' | 'name' | 'subdomain' | 'plan';
  sortOrder?: 'asc' | 'desc';
}

export interface TenantListResult {
  tenants: TenantOverviewRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get paginated list of tenants with search and filters
 */
export async function getTenantList(
  options: TenantListOptions = {}
): Promise<TenantListResult> {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    plan,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Build where conditions
  const conditions = [];

  if (status) {
    conditions.push(eq(tenantsInGovernance.status, status));
  }

  if (plan) {
    conditions.push(eq(tenantsInGovernance.plan, plan));
  }

  if (search) {
    // Search in name or subdomain
    const searchPattern = `%${search}%`;
    conditions.push(
      sql`(${tenantsInGovernance.name} ILIKE ${searchPattern} OR ${tenantsInGovernance.subdomain} ILIKE ${searchPattern})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Build order by
  const orderByColumn =
    sortBy === 'name'
      ? tenantsInGovernance.name
      : sortBy === 'subdomain'
        ? tenantsInGovernance.subdomain
        : sortBy === 'plan'
          ? tenantsInGovernance.plan
          : tenantsInGovernance.createdAt;

  const orderBy =
    sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

  // Get total count
  const countResult = await adminDb
    .select({ total: count() })
    .from(tenantsInGovernance)
    .where(whereClause);

  const total = countResult[0]?.total || 0;

  // Get paginated results
  const offset = (page - 1) * limit;
  const results = await adminDb
    .select()
    .from(tenantsInGovernance)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return {
    tenants: results.map(mapToOverviewRecord),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single tenant by ID
 */
export async function getTenantById(
  id: string
): Promise<TenantOverviewRecord | null> {
  const results = await adminDb
    .select()
    .from(tenantsInGovernance)
    .where(eq(tenantsInGovernance.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return mapToOverviewRecord(results[0]);
}

/**
 * Get tenant by subdomain
 */
export async function getTenantBySubdomain(
  subdomain: string
): Promise<TenantOverviewRecord | null> {
  const results = await adminDb
    .select()
    .from(tenantsInGovernance)
    .where(eq(tenantsInGovernance.subdomain, subdomain))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return mapToOverviewRecord(results[0]);
}

/**
 * Update tenant status (suspend, activate, etc.)
 */
export async function updateTenantStatus(
  id: string,
  status: TenantStatus
): Promise<TenantOverviewRecord | null> {
  const result = await adminDb
    .update(tenantsInGovernance)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tenantsInGovernance.id, id))
    .returning();

  if (result.length === 0) {
    return null;
  }

  return mapToOverviewRecord(result[0]);
}

/**
 * Update tenant plan
 */
export async function updateTenantPlan(
  id: string,
  plan: TenantPlan
): Promise<TenantOverviewRecord | null> {
  const result = await adminDb
    .update(tenantsInGovernance)
    .set({
      plan,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tenantsInGovernance.id, id))
    .returning();

  if (result.length === 0) {
    return null;
  }

  return mapToOverviewRecord(result[0]);
}

/**
 * Update tenant details
 */
export async function updateTenant(
  id: string,
  updates: {
    name?: string;
    subdomain?: string;
    plan?: TenantPlan;
    status?: TenantStatus;
  }
): Promise<TenantOverviewRecord | null> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.subdomain) updateData.subdomain = updates.subdomain;
  if (updates.plan) updateData.plan = updates.plan;
  if (updates.status) updateData.status = updates.status;

  const result = await adminDb
    .update(tenantsInGovernance)
    .set(updateData as never)
    .where(eq(tenantsInGovernance.id, id))
    .returning();

  if (result.length === 0) {
    return null;
  }

  return mapToOverviewRecord(result[0]);
}

/**
 * Delete a tenant (with safety checks)
 */
export async function deleteTenant(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if tenant exists
    const existing = await getTenantById(id);
    if (!existing) {
      return { success: false, error: 'Tenant not found' };
    }

    // Prevent deletion of active tenantsInGovernance (must suspend first)
    if (existing.status === 'active') {
      return {
        success: false,
        error: 'Cannot delete active tenant. Suspend first.',
      };
    }

    await adminDb
      .delete(tenantsInGovernance)
      .where(eq(tenantsInGovernance.id, id));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get tenant statistics summary
 */
export async function getTenantStats(): Promise<{
  total: number;
  byStatus: Record<TenantStatus, number>;
  byPlan: Record<TenantPlan, number>;
  recent: number; // Created in last 7 days
}> {
  const allTenants = await adminDb.select().from(tenantsInGovernance);

  const byStatus: Record<string, number> = {
    active: 0,
    suspended: 0,
    archived: 0,
  };

  const byPlan: Record<string, number> = {
    free: 0,
    basic: 0,
    pro: 0,
    enterprise: 0,
  };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let recent = 0;

  for (const tenant of allTenants) {
    byStatus[tenant.status] = (byStatus[tenant.status] || 0) + 1;
    byPlan[tenant.plan] = (byPlan[tenant.plan] || 0) + 1;

    if (tenant.createdAt && new Date(tenant.createdAt) > sevenDaysAgo) {
      recent++;
    }
  }

  return {
    total: allTenants.length,
    byStatus: byStatus as Record<TenantStatus, number>,
    byPlan: byPlan as Record<TenantPlan, number>,
    recent,
  };
}

/**
 * Kill switch - immediately suspend a tenant
 */
export async function killSwitch(subdomain: string): Promise<boolean> {
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) {
    return false;
  }

  const result = await updateTenantStatus(tenant.id, 'suspended');
  return result !== null;
}

/**
 * Map database record to overview record
 */
function mapToOverviewRecord(dbRecord: Tenant): TenantOverviewRecord {
  return {
    id: dbRecord.id,
    subdomain: dbRecord.subdomain,
    name: dbRecord.name,
    plan: dbRecord.plan as TenantPlan,
    status: dbRecord.status as TenantStatus,
    createdAt: dbRecord.createdAt ? new Date(dbRecord.createdAt) : new Date(),
    updatedAt: dbRecord.updatedAt ? new Date(dbRecord.updatedAt) : new Date(),
  };
}
