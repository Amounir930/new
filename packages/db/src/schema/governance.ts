/**
 * Governance Schema (Admin Layer) — V5 Enterprise Hardening
 *
 * Tables: tenants, audit_logs, leads, feedback.
 * Performance: Range Partitioning + BRIN Indexes.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgMaterializedView,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  actorTypeEnum,
  auditResultEnum,
  leadStatusEnum,
  severityEnum,
  tenantPlanEnum,
  tenantStatusEnum,
} from './enums';
import {
  bytea,
  encryptedCheck,
  encryptedText,
  microAmount,
  moneyAmount,
  ulidId,
} from './v5-core';

export const governanceSchema = pgSchema('governance');

/**
 * 🏢 Platform Tenants (Global Registry)
 * ALIGNMENT: UUID -> TS -> ENUM -> TEXT -> JSONB
 */
export const tenants = governanceSchema.table(
  'tenants',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    trialEndsAt: timestamp('trial_ends_at', {
      withTimezone: true,
      precision: 6,
    }),
    suspendedAt: timestamp('suspended_at', {
      withTimezone: true,
      precision: 6,
    }),

    // ── 2. Enum ──
    plan: tenantPlanEnum('plan').default('free').notNull(),
    status: tenantStatusEnum('status').default('active').notNull(),

    // ── 3. Scalar (S7 Safety via TEXT) ──
    subdomain: text('subdomain').notNull().unique(),
    name: text('name').notNull(),
    customDomain: text('custom_domain'), // Fixed: unique index added in extra indices
    domainVerifiedAt: timestamp('domain_verified_at', {
      withTimezone: true,
      precision: 6,
    }),
    ownerEmail: encryptedText('owner_email'), // Mandate #12: S7 Encrypted
    ownerEmailHash: text('owner_email_hash'), // Audit 999 Point #23: Blind index for searching
    secretSalt: text('secret_salt')
      .notNull()
      .default(sql`gen_random_uuid()::text`), // Mandate #11
    oldSecretSalt: text('old_secret_salt'), // Vector 1: Salt Rotation Support
    saltRotatedAt: timestamp('salt_rotated_at', { withTimezone: true, precision: 6 }),
    suspendedReason: text('suspended_reason'),
    nicheType: text('niche_type'),

    // ── 4. JSONB (Variable) ──
    uiConfig: jsonb('ui_config').notNull().default({}),
  },
  (table) => ({
    idxTenantSubdomain: uniqueIndex('idx_tenant_subdomain').on(table.subdomain),
    // Decision #9: Domain Hijacking unique index
    idxTenantCustomDomain: uniqueIndex('idx_tenant_custom_domain').on(
      table.customDomain
    ),
    idxTenantOwnerEmailHash: index('idx_tenant_email_hash').on(
      table.ownerEmailHash
    ),
    // Mandate #12: S7 Integrity check
    ownerEmailEncrypted: encryptedCheck(table.ownerEmail),
    // Mandate #16: Domain Verification Enforcement
    domainVerifiedCheck: sql`CHECK (custom_domain IS NULL OR domain_verified_at IS NOT NULL)`,
  })
);

/**
 * 👤 Central Identity (Users)
 * Mandate #14: External IdP reference strategy / Central Identity.
 */
export const governanceUsers = governanceSchema.table(
  'users',
  {
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    email: encryptedText('email').notNull().unique(),
    externalId: text('external_id').unique(), // Firebase/Auth0 Ref
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => ({
    emailEncrypted: encryptedCheck(table.email),
  })
);

// Alias for backward compatibility (Audit 444 Verification)
export const users = governanceUsers;

/**
 * 💳 Subscription Plans
 * ALIGNMENT: UUID -> TS -> BIGINT -> BOOL -> TEXT
 */
export const subscriptionPlans = governanceSchema.table('subscription_plans', {
  // ── 1. Fixed ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),

  // ── 2. Money (BigInt Cents) ──
  priceMonthly: moneyAmount('price_monthly').notNull(),
  priceYearly: moneyAmount('price_yearly').notNull(),

  // ── 3. Boolean ──
  isActive: boolean('is_active').default(true).notNull(),

  // ── 4. Text ──
  name: text('name').notNull(),
  code: text('code').notNull().unique(), // lite, pro, enterprise
  description: text('description'),
});

/**
 * 📊 Tenant Quotas
 * ALIGNMENT: UUID -> TS -> INT -> BOOL
 */
export const tenantQuotas = governanceSchema.table('tenant_quotas', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),

  // ── 2. Integer ──
  maxProducts: integer('max_products').default(100),
  maxOrders: integer('max_orders').default(1000),
  maxStaff: integer('max_staff').default(3),
  storageLimitGb: integer('storage_limit_gb').default(1),

  // ── 3. Denormalized Counters (Point #7) ──
  currentProductsCount: integer('current_products_count').default(0).notNull(),
  currentOrdersCount: integer('current_orders_count').default(0).notNull(),

  // ── 4. Boolean ──
  isPrioritySupport: boolean('is_priority_support').default(false).notNull(),
});

/**
 * 📜 Platform Audit Logs
 * ARCHITECTURE: Partitioned by Range (created_at).
 * OPTIMIZATION: BRIN Index for massive append-only logs.
 */
export const governanceAuditLogs = governanceSchema.table(
  'audit_logs',
  {
    // ── 1. Fixed (Aligned) ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // ── 2. Enum ──
    severity: severityEnum('severity').default('INFO').notNull(),
    result: auditResultEnum('result').default('SUCCESS').notNull(),

    // ── 3. Scalar ──
    tenantId: text('tenant_id').notNull(),
    actorType: actorTypeEnum('actor_type').notNull().default('tenant_admin'), // Mandate #9: super_admin, tenant_admin, system
    userId: text('user_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // ── 4. JSONB ──
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    metadata: jsonb('metadata'),
    // Mandate #26: Integrity Checksum
    checksum: text('checksum'), // HMAC-SHA256(old_values + new_values + secret)
  },
  (table) => ({
    // Decision #16: BRIN for time-series range efficiency.
    idxAuditCreatedBrin: index('idx_audit_created_brin').using(
      'brin',
      table.createdAt
    ),
    idxAuditTenant: index('idx_audit_tenant_action').on(
      table.tenantId,
      table.action
    ),
  })
);

// Alias for backward compatibility (Audit 444 Verification)
export const auditLogs = governanceAuditLogs;

/**
 * 📈 Platform Leads (CRM)
 */
export const leads = governanceSchema.table(
  'leads',
  {
    // ── 1. Fixed ──
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    convertedTenantId: uuid('converted_tenant_id').references(
      () => tenants.id,
      {
        onDelete: 'restrict',
      }
    ),

    // ── 2. Enum ──
    status: leadStatusEnum('status').default('new').notNull(),

    // ── 3. Scalar ──
    email: encryptedText('email').notNull(),
    emailHash: bytea('email_hash'), // Binary hash for lookups
    name: text('name'),
    source: text('source'),

    // ── 4. Array ──
    tags: text('tags').array(), // Decision #10: text[]
  },
  (table) => ({
    // Mandate #18: Lead Conversion Duplication
    idxLeadConversionActive: uniqueIndex('idx_lead_conversion_active')
      .on(table.convertedTenantId)
      .where(sql`converted_tenant_id IS NOT NULL`),
    emailEncrypted: encryptedCheck(table.email),
  })
);

/**
 * ⚡ Dunning Events (Billing Failure Recovery)
 */
export const dunningEvents = governanceSchema.table('dunning_events', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  nextAttemptAt: timestamp('next_attempt_at', {
    withTimezone: true,
    precision: 6,
  }),

  // ── 2. Money ──
  amount: microAmount('amount').notNull().default(sql`0`), // Fixed: BigInt Cents

  // ── 3. Integer ──
  attemptCount: integer('attempt_count').default(1).notNull(),

  // ── 4. Text ──
  status: text('status').notNull().default('pending'), // pending, failed, recovered
  errorCode: text('error_code'),
});

/**
 * 📉 App Usage Records (Metered Billing)
 */
export const appUsageRecords = governanceSchema.table('app_usage_records', {
  // ── 1. Fixed ──
  id: ulidId(),
  // Directive #3: No physical FKs to isolated tenant schemas.
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),

  // ── 2. BigInt (Micro-Cents) ──
  unitPrice: microAmount('unit_price').notNull().default(sql`0`),

  // ── 3. Integer ──
  quantity: integer('quantity').notNull(),

  // ── 4. Text ──
  metricKey: text('metric_key').notNull(), // api_calls, storage_used
});

/**
 * 🧾 Tenant Invoices (B2B Billing)
 * ALIGNMENT: UUID -> TS -> BIGINT -> ENUM -> TEXT
 */
export const tenantInvoices = governanceSchema.table('tenant_invoices', {
  // ── 1. Fixed ──
  id: ulidId(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true, precision: 6 }),

  // ── 2. Money (BigInt Cents) ──
  subscriptionAmount: microAmount('subscription_amount').notNull(),
  overageAmount: microAmount('overage_amount').default(sql`0`).notNull(),
  taxAmount: microAmount('tax_amount').default(sql`0`).notNull(),
  totalAmount: microAmount('total_amount').notNull(),

  // ── 3. Enum ──
  status: text('status').notNull().default('draft'), // draft, open, paid, void, uncollectible

  // ── 4. Text ──
  invoiceNumber: text('invoice_number').notNull().unique(),
  currency: text('currency').notNull().default('SAR'),
});

/**
 * 💰 Materialized Billing View (Point #1)
 */
export const tenantBillingMetrics = governanceSchema
  .materializedView('mv_tenant_billing')
  .as((qb) =>
    qb
      .select({
        tenantId: governanceAuditLogs.tenantId,
        totalActions: sql<bigint>`count(*)`.as('total_actions'),
        lastActivity: sql<string>`max(created_at)`.as('last_activity'),
      })
      .from(governanceAuditLogs)
      .groupBy(governanceAuditLogs.tenantId)
  );

// Type Exports
export type Tenant = typeof tenants.$inferSelect;
export type GovernanceUser = typeof governanceUsers.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type TenantQuota = typeof tenantQuotas.$inferSelect;
export type GovernanceAuditLog = typeof governanceAuditLogs.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type DunningEvent = typeof dunningEvents.$inferSelect;
export type AppUsageRecord = typeof appUsageRecords.$inferSelect;

/**
 * ⚙️ Global System Settings (Mandate #20)
 * Allows Super Admin to toggle platform-wide feature features.
 */
export const systemSettings = governanceSchema.table('system_settings', {
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  config: jsonb('config').notNull().default({}),
});

export type SystemSetting = typeof systemSettings.$inferSelect;

/**
 * 🗺️ Onboarding Blueprints
 * Global library of templates for tenant generation.
 */
export const onboardingBlueprints = governanceSchema.table(
  'onboarding_blueprints',
  {
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    nicheType: text('niche_type').notNull().unique(),
    uiConfig: jsonb('ui_config').notNull().default({}),
    status: text('status').notNull().default('active'), // active, applied, deprecated
  }
);

export type OnboardingBlueprint = typeof onboardingBlueprints.$inferSelect;

/**
 * 🚩 Feature Gates (Mandate #21)
 * Controls availability of features per tenant or per plan.
 */
export const featureGates = governanceSchema.table(
  'feature_gates',
  {
    id: ulidId(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    tenantId: uuid('tenant_id').references(() => tenants.id),
    planCode: text('plan_code'),
    featureKey: text('feature_key').notNull(),
    isEnabled: boolean('is_enabled').default(false).notNull(),
  },
  (table) => ({
    idxFeatureKey: index('idx_feature_key').on(table.featureKey),
    idxFeatureTenant: index('idx_feature_tenant').on(table.tenantId),
  })
);

export type FeatureGate = typeof featureGates.$inferSelect;

/**
 * 🛂 Administrative Roles (Mandate #24)
 * Separation between Super Admin and Tenant Admin.
 */
export const roles = governanceSchema.table('roles', {
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  name: text('name').notNull().unique(), // super_admin, tenant_admin, staff_admin
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(), // Cannot be deleted
});

/**
 * 🔒 RBAC Permissions (Mandate #23)
 * Maps roles to granular resource permissions.
 */
export const permissions = governanceSchema.table(
  'permissions',
  {
    id: ulidId(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 6 })
      .defaultNow()
      .notNull(),

    // Mandate #23: Strict JSONB structure with CHECK constraint
    // Format: { "resource:action": "allow" }
    resourcePermissions: jsonb('resource_permissions').notNull().default({}),
  },
  (table) => ({
    // Mandate #23: DB-level Regex validation for JSONB keys
    idxPermissionRole: index('idx_permission_role').on(table.roleId),
    checkPermissionFormat: sql`CHECK (resource_permissions::text ~ '^[^{]*{"[a-z]+:[a-z]+": "allow".*}')`,
  })
);

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
