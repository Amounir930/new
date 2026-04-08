import { customType } from 'drizzle-orm/pg-core';
export const int4range = customType<{ data: string }>({
  dataType() {
    return 'int4range';
  },
});
export const tstzrange = customType<{ data: string }>({
  dataType() {
    return 'tstzrange';
  },
});
export const byteaCol = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  date,
  foreignKey,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';

export const governance = pgSchema('governance');
export const storefront = pgSchema('storefront');
export const vault = pgSchema('vault');
export const shared = pgSchema('shared');
export const actorType = pgEnum('actor_type', [
  'super_admin',
  'tenant_admin',
  'system',
]);
export const affiliateStatus = pgEnum('affiliate_status', [
  'active',
  'pending',
  'suspended',
]);
export const affiliateTxStatus = pgEnum('affiliate_tx_status', [
  'pending',
  'approved',
  'paid',
  'rejected',
]);
export const auditResultEnum = pgEnum('audit_result_enum', [
  'SUCCESS',
  'FAILURE',
]);
export const b2BCompanyStatus = pgEnum('b2b_company_status', [
  'active',
  'pending',
  'suspended',
]);
export const b2BUserRole = pgEnum('b2b_user_role', [
  'admin',
  'buyer',
  'viewer',
]);
export const blueprintStatus = pgEnum('blueprint_status', ['active', 'paused']);
export const consentChannel = pgEnum('consent_channel', [
  'email',
  'sms',
  'push',
  'whatsapp',
]);
export const discountAppliesTo = pgEnum('discount_applies_to', [
  'all',
  'specific_products',
  'specific_categories',
  'specific_customers',
]);
export const discountType = pgEnum('discount_type', [
  'percentage',
  'fixed',
  'buy_x_get_y',
  'free_shipping',
]);
export const dunningStatus = pgEnum('dunning_status', [
  'pending',
  'retried',
  'failed',
  'recovered',
]);
export const fulfillmentStatus = pgEnum('fulfillment_status', [
  'pending',
  'shipped',
  'in_transit',
  'delivered',
  'failed',
]);
export const inventoryMovementType = pgEnum('inventory_movement_type', [
  'in',
  'out',
  'adjustment',
  'return',
  'transfer',
]);
export const invoiceStatus = pgEnum('invoice_status', [
  'draft',
  'issued',
  'paid',
  'overdue',
]);
export const leadStatus = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'converted',
]);
export const locationType = pgEnum('location_type', [
  'warehouse',
  'retail',
  'dropship',
]);
export const orderSource = pgEnum('order_source', [
  'web',
  'mobile',
  'b2b',
  'pos',
]);
export const orderStatus = pgEnum('order_status', [
  'draft',
  'awaiting_approval',
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]);
export const nicheType = pgEnum('niche_type', [
  'retail',
  'wellness',
  'education',
  'services',
  'hospitality',
  'real_estate',
  'creative',
  'food',
  'digital',
]);
export const outboxStatus = pgEnum('outbox_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);
export const paymentMethod = pgEnum('payment_method', [
  'card',
  'cod',
  'wallet',
  'bnpl',
  'bank_transfer',
]);
export const paymentStatus = pgEnum('payment_status', [
  'pending',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);
export const purchaseOrderStatus = pgEnum('purchase_order_status', [
  'draft',
  'ordered',
  'partial',
  'received',
  'cancelled',
]);
export const refundStatus = pgEnum('refund_status', [
  'pending',
  'processed',
  'failed',
]);
export const reservationStatus = pgEnum('reservation_status', [
  'active',
  'converted',
  'expired',
]);
export const rmaCondition = pgEnum('rma_condition', [
  'new',
  'opened',
  'damaged',
]);
export const rmaReasonCode = pgEnum('rma_reason_code', [
  'defective',
  'wrong_item',
  'changed_mind',
  'not_as_described',
  'damaged_in_transit',
]);
export const rmaResolution = pgEnum('rma_resolution', [
  'refund',
  'exchange',
  'store_credit',
]);
export const rmaStatus = pgEnum('rma_status', [
  'requested',
  'approved',
  'shipped',
  'received',
  'completed',
  'rejected',
]);
export const severityEnum = pgEnum('severity_enum', [
  'INFO',
  'WARNING',
  'CRITICAL',
  'SECURITY_ALERT',
]);
export const tenantPlan = pgEnum('tenant_plan', [
  'free',
  'basic',
  'pro',
  'enterprise',
]);
export const tenantStatus = pgEnum('tenant_status', [
  'active',
  'suspended',
  'pending',
  'archived',
  'purging',
  'deleted',
]);
export const transferStatus = pgEnum('transfer_status', [
  'draft',
  'in_transit',
  'received',
  'cancelled',
]);

export const apexMigrations = pgTable(
  'apex_migrations',
  {
    id: serial().primaryKey().notNull(),
    filename: text().notNull(),
    appliedAt: timestamp('applied_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique('apex_migrations_filename_key').on(table.filename)]
);

export const pagesInStorefront = pgTable(
  'pages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    isPublished: boolean('is_published').default(false).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    pageType: varchar('page_type', { length: 50 }).default('custom').notNull(),
    template: varchar({ length: 50 }).default('default').notNull(),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    title: jsonb().notNull(),
    content: jsonb(),
  },
  (table) => [
    index('idx_pages_published').using(
      'btree',
      table.isPublished.asc().nullsLast().op('bool_ops')
    ),
    uniqueIndex('idx_pages_slug_active')
      .using('btree', table.slug.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    check('chk_page_slug', sql`(slug)::text ~ '^[a-z0-9-]+$'::text`),
  ]
);

export const appUsageRecordsInGovernance = governance.table(
  'app_usage_records',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    appId: uuid('app_id').notNull(),
    quantity: integer().notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 4 }).notNull(),
    currency: char({ length: 3 }).default('USD').notNull(),
    metric: varchar({ length: 50 }).notNull(),
  },
  (table) => [
    index('idx_app_usage_records_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
  ]
);

export const legalPagesInStorefront = pgTable(
  'legal_pages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    version: integer().default(1).notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    pageType: text('page_type').notNull(),
    lastEditedBy: text('last_edited_by'),
    title: jsonb().notNull(),
    content: jsonb().notNull(),
  },
  (table) => [
    index('idx_legal_published').using(
      'btree',
      table.isPublished.asc().nullsLast().op('bool_ops')
    ),
    unique('uq_legal_page_type').on(table.pageType),
    check(
      'ck_legal_page_type',
      sql`page_type = ANY (ARRAY['privacy_policy'::text, 'terms_of_service'::text, 'shipping_policy'::text, 'return_policy'::text, 'cookie_policy'::text])`
    ),
    check('ck_legal_version_positive', sql`version > 0`),
  ]
);

export const dunningEventsInGovernance = governance.table(
  'dunning_events',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    attemptNumber: integer('attempt_number').default(1).notNull(),
    status: dunningStatus().default('pending').notNull(),
    amount: numeric({ precision: 12, scale: 4 }).notNull(),
    nextRetryAt: timestamp('next_retry_at', {
      withTimezone: true,
      mode: 'string',
    }),
    paymentMethod: text('payment_method'),
    errorMessage: text('error_message'),
  },
  (table) => [
    index('idx_dunning_events_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check(
      'chk_dunning_amount',
      sql`COALESCE(amount, (0)::numeric) > (0)::numeric`
    ),
    check('chk_dunning_attempts', sql`attempt_number <= 5`),
  ]
);

export const featureGatesInGovernance = governance.table(
  'feature_gates',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isEnabled: boolean('is_enabled').default(false).notNull(),
    planCode: varchar('plan_code', { length: 50 }),
    featureKey: varchar('feature_key', { length: 100 }).notNull(),
    rolloutPercentage: integer('rollout_percentage').default(100).notNull(),
    metadata: jsonb(),
  },
  (table) => [
    index('idx_feature_gates_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_feature_key').using(
      'btree',
      table.featureKey.asc().nullsLast().op('text_ops')
    ),
    index('idx_feature_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_feature_tenant_key').on(table.tenantId, table.featureKey),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check('chk_fg_meta_size', sql`pg_column_size(metadata) <= 51200`),
    check(
      'chk_rollout_range',
      sql`(rollout_percentage >= 0) AND (rollout_percentage <= 100)`
    ),
  ]
);

export const leadsInGovernance = governance.table(
  'leads',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    leadScore: integer('lead_score'),
    convertedTenantId: uuid('converted_tenant_id'),
    status: leadStatus().default('new').notNull(),
    email: jsonb().notNull(),
    emailHash: text('email_hash').notNull(),
    name: jsonb(),
    notes: jsonb(),
    source: varchar({ length: 50 }),
    landingPageUrl: text('landing_page_url'),
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    tags: jsonb().notNull(),
  },
  (table) => [
    index('idx_leads_converted').using(
      'btree',
      table.convertedTenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_leads_email_hash').using(
      'btree',
      table.emailHash.asc().nullsLast().op('text_ops')
    ),
    index('idx_leads_status').using(
      'btree',
      table.status.asc().nullsLast().op('enum_ops')
    ),
    index('idx_leads_tenant').using(
      'btree',
      table.convertedTenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(converted_tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check(
      'chk_leads_email_s7',
      sql`(email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))`
    ),
    check(
      'chk_leads_name_s7',
      sql`(name IS NULL) OR ((jsonb_typeof(name) = 'object'::text) AND (name ? 'enc'::text) AND (name ? 'iv'::text) AND (name ? 'tag'::text) AND (name ? 'data'::text))`
    ),
    check(
      'chk_leads_notes_s7',
      sql`(notes IS NULL) OR ((jsonb_typeof(notes) = 'object'::text) AND (notes ? 'enc'::text) AND (notes ? 'iv'::text) AND (notes ? 'tag'::text) AND (notes ? 'data'::text))`
    ),
  ]
);

export const marketingPagesInGovernance = governance.table(
  'marketing_pages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'string',
    }),
    isPublished: boolean('is_published').default(false).notNull(),
    slug: text().notNull(),
    pageType: text('page_type').default('landing').notNull(),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    createdBy: text('created_by'),
    title: jsonb().notNull(),
    content: jsonb().notNull(),
  },
  (table) => [
    index('idx_mkt_published').using(
      'btree',
      table.isPublished.asc().nullsLast().op('bool_ops')
    ),
    index('idx_mkt_slug').using(
      'btree',
      table.slug.asc().nullsLast().op('text_ops')
    ),
    index('idx_mkt_type').using(
      'btree',
      table.pageType.asc().nullsLast().op('text_ops')
    ),
    unique('uq_marketing_slug').on(table.slug),
  ]
);

// 🔒 GHOST TABLE MAPPING: audit_logs is RANGE-partitioned by created_at in production.
// Drizzle does not support partitioned tables, so we map it as a standard pgTable to
// prevent drizzle-kit from attempting to DROP it. Partitioning is managed by SQL migrations.
export const auditLogsInGovernance = governance.table(
  'audit_logs',
  {
    id: uuid().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    severity: severityEnum().default('INFO').notNull(),
    result: auditResultEnum().default('SUCCESS').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    actorType: actorType().default('tenant_admin').notNull(),
    userId: text('user_id'),
    userEmail: jsonb('user_email'),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: varchar('entity_id', { length: 100 }),
    action: text().notNull(),
    publicKey: text('public_key').notNull(),
    encryptedKey: byteaCol('encrypted_key').notNull(),
    version: integer().default(1).notNull(),
    userAgent: text('user_agent'),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    metadata: jsonb(),
    impersonatorId: uuid('impersonator_id'),
    checksum: text(),
  },
  (table) => [
    index('idx_audit_action').using(
      'btree',
      table.action.asc().nullsLast().op('text_ops')
    ),
    index('idx_audit_created_brin').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_audit_entity').using(
      'btree',
      table.entityType.asc().nullsLast().op('text_ops'),
      table.entityId.asc().nullsLast().op('text_ops')
    ),
    index('idx_audit_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check(
      'chk_audit_email_s7',
      sql`(user_email IS NULL) OR ((jsonb_typeof(user_email) = 'object'::text) AND (user_email ? 'enc'::text) AND (user_email ? 'iv'::text) AND (user_email ? 'tag'::text) AND (user_email ? 'data'::text))`
    ),
    check(
      'chk_audit_json_size',
      sql`(pg_column_size(old_values) <= 102400) AND (pg_column_size(new_values) <= 102400)`
    ),
    check(
      'chk_audit_sanitization',
      sql`((old_values IS NULL) OR (NOT (old_values ?| ARRAY['password'::text, 'secret'::text, 'token'::text, 'cvv'::text, 'card_number'::text]))) AND ((new_values IS NULL) OR (NOT (new_values ?| ARRAY['password'::text, 'secret'::text, 'token'::text, 'cvv'::text, 'card_number'::text])))`
    ),
  ]
);

export const onboardingBlueprintsInGovernance = governance.table(
  'onboarding_blueprints',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    plan: tenantPlan().default('free').notNull(),
    nicheType: nicheType('niche_type').default('retail').notNull(),
    status: blueprintStatus().default('active').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    name: text().notNull(),
    description: text(),
    blueprint: jsonb().notNull(),
    uiConfig: jsonb('ui_config').notNull(),
  },
  (table) => [
    index('blueprint_niche_plan_idx').using(
      'btree',
      table.nicheType.asc().nullsLast().op('enum_ops'),
      table.plan.asc().nullsLast().op('enum_ops')
    ),
  ]
);

export const planChangeHistoryInGovernance = governance.table(
  'plan_change_history',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    fromPlan: varchar('from_plan', { length: 50 }).notNull(),
    toPlan: varchar('to_plan', { length: 50 }).notNull(),
    reason: text(),
    changedBy: text('changed_by').notNull(),
  },
  (table) => [
    index('idx_plan_change_history_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
  ]
);

export const schemaDriftLogInGovernance = governance.table(
  'schema_drift_log',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    commandTag: text('command_tag'),
    objectType: text('object_type'),
    objectIdentity: text('object_identity'),
    actorId: text('actor_id'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    executedAt: timestamp('executed_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_drift_time').using(
      'brin',
      table.executedAt.asc().nullsLast().op('timestamptz_minmax_ops')
    ),
  ]
);

export const systemConfigInGovernance = governance.table('system_config', {
  key: varchar({ length: 100 }).primaryKey().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  value: jsonb().notNull(),
});

export const tenantInvoicesInGovernance = governance.table(
  'tenant_invoices',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    subscriptionAmount: numeric('subscription_amount', {
      precision: 12,
      scale: 4,
    })
      .default('0')
      .notNull(),
    platformCommission: numeric('platform_commission', {
      precision: 12,
      scale: 4,
    })
      .default('0')
      .notNull(),
    appCharges: numeric('app_charges', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    total: numeric({ precision: 12, scale: 4 }).notNull(),
    status: invoiceStatus().default('draft').notNull(),
    currency: char({ length: 3 }).default('USD').notNull(),
    pdfUrl: text('pdf_url'),
  },
  (table) => [
    index('idx_invoices_status').using(
      'btree',
      table.status.asc().nullsLast().op('enum_ops')
    ),
    index('idx_invoices_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_tenant_invoices_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check(
      'chk_invoice_math',
      sql`COALESCE(total, (0)::numeric) = ((COALESCE(subscription_amount, (0)::numeric) + COALESCE(platform_commission, (0)::numeric)) + COALESCE(app_charges, (0)::numeric))`
    ),
    check('chk_invoice_period', sql`period_end >= period_start`),
  ]
);

export const tenantQuotasInGovernance = governance.table(
  'tenant_quotas',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    maxProducts: integer('max_products'),
    maxOrders: integer('max_orders'),
    maxPages: integer('max_pages'),
    maxStaff: integer('max_staff'),
    maxCategories: integer('max_categories'),
    maxCoupons: integer('max_coupons'),
    storageLimitGb: integer('storage_limit_gb').default(1).notNull(),
    apiRateLimit: integer('api_rate_limit'),
  },
  (table) => [
    index('idx_tenant_quotas_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
  ]
);

export const encryptionKeysInVault = vault.table(
  'encryption_keys',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    rotatedAt: timestamp('rotated_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    keyVersion: integer('key_version').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    algorithm: varchar({ length: 20 }).default('AES-256-GCM').notNull(),
    keyFingerprint: varchar('key_fingerprint', { length: 64 }),
    keyMaterial: jsonb('key_material').notNull(),
  },
  (table) => [
    index('idx_encryption_keys_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check(
      'chk_key_material_s7',
      sql`(key_material IS NULL) OR ((jsonb_typeof(key_material) = 'object'::text) AND (key_material ? 'enc'::text) AND (key_material ? 'iv'::text) AND (key_material ? 'tag'::text) AND (key_material ? 'data'::text))`
    ),
  ]
);

export const entityMetafieldsInStorefront = pgTable(
  'entity_metafields',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    namespace: varchar({ length: 100 }).default('global').notNull(),
    key: varchar({ length: 100 }).notNull(),
    type: varchar({ length: 20 }).default('string').notNull(),
    value: jsonb().notNull(),
  },
  (table) => [
    index('idx_metafields_lookup').using(
      'btree',
      table.entityType.asc().nullsLast().op('text_ops'),
      table.entityId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_metafield').on(
      table.entityType,
      table.entityId,
      table.namespace,
      table.key
    ),
    check('chk_metafield_size', sql`pg_column_size(value) <= 10240`),
  ]
);

export const loyaltyRulesInStorefront = pgTable(
  'loyalty_rules',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 100 }).notNull(),
    pointsPerCurrency: numeric('points_per_currency', {
      precision: 10,
      scale: 4,
    })
      .default('1')
      .notNull(),
    minRedeemPoints: integer('min_redeem_points').default(100).notNull(),
    pointsExpiryDays: integer('points_expiry_days'),
    rewards: jsonb().default([]).notNull(),
    isActive: integer('is_active').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (_table) => [
    check(
      'chk_loyalty_math',
      sql`(points_per_currency > (0)::numeric) AND (min_redeem_points > 0)`
    ),
    check(
      'chk_points_expiry',
      sql`(points_expiry_days IS NULL) OR (points_expiry_days > 0)`
    ),
  ]
);

export const walletTransactionsInStorefront = pgTable(
  'wallet_transactions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id').notNull(),
    orderId: uuid('order_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    amount: numeric({ precision: 12, scale: 4 }).notNull(),
    balanceBefore: numeric('balance_before', {
      precision: 12,
      scale: 4,
    }).notNull(),
    balanceAfter: numeric('balance_after', {
      precision: 12,
      scale: 4,
    }).notNull(),
    type: varchar({ length: 20 }).notNull(),
    reason: varchar({ length: 100 }).notNull(),
    description: text(),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
  },
  (table) => [
    index('idx_wallet_created').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_minmax_ops')
    ),
    index('idx_wallet_customer').using(
      'btree',
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('wallet_tx_idempotency')
      .using('btree', table.idempotencyKey.asc().nullsLast().op('text_ops'))
      .where(sql`(idempotency_key IS NOT NULL)`),
    check(
      'chk_wallet_math',
      sql`COALESCE(balance_after, (0)::numeric) = (COALESCE(balance_before, (0)::numeric) + COALESCE(amount, (0)::numeric))`
    ),
    check(
      'wallet_non_negative_balance',
      sql`COALESCE(balance_after, (0)::numeric) >= (0)::numeric`
    ),
  ]
);

export const announcementBarsInStorefront = pgTable('announcement_bars', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  bgColor: varchar('bg_color', { length: 20 }).default('#000000').notNull(),
  textColor: varchar('text_color', { length: 20 }).default('#ffffff').notNull(),
  content: jsonb().notNull(),
  linkUrl: text('link_url'),
});

export const archivalVaultInVault = vault.table(
  'archival_vault',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tableName: text('table_name').notNull(),
    originalId: text('original_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedBy: text('deleted_by').notNull(),
    payload: jsonb().notNull(),
    tombstoneHash: text('tombstone_hash').notNull(),
  },
  (_table) => [
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check('chk_payload_size', sql`pg_column_size(payload) <= 102400`),
  ]
);

export const customerSegmentsInStorefront = pgTable('customer_segments', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  customerCount: integer('customer_count').default(0).notNull(),
  autoUpdate: boolean('auto_update').default(true).notNull(),
  matchType: varchar('match_type', { length: 5 }).default('all').notNull(),
  name: jsonb().notNull(),
  conditions: jsonb().notNull(),
});

export const customersInStorefront = pgTable(
  'customers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp('last_login_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    dateOfBirth: date('date_of_birth'),
    walletBalance: numeric('wallet_balance', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    totalSpentAmount: numeric('total_spent_amount', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    loyaltyPoints: integer('loyalty_points').default(0).notNull(),
    totalOrdersCount: integer('total_orders_count').default(0).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    acceptsMarketing: boolean('accepts_marketing').default(false).notNull(),
    email: jsonb().notNull(),
    emailHash: char('email_hash', { length: 64 }).notNull(),
    passwordHash: text('password_hash'),
    googleId: text('google_id'),
    firstName: jsonb('first_name'),
    lastName: jsonb('last_name'),
    phone: jsonb(),
    phoneHash: char('phone_hash', { length: 64 }),
    avatarUrl: text('avatar_url'),
    gender: varchar({ length: 10 }),
    language: char({ length: 2 }).default('ar').notNull(),
    notes: text(),
    tags: text(),
    version: integer().default(1).notNull(),
    lockVersion: integer('lock_version').default(1).notNull(),
  },
  (table) => [
    uniqueIndex('idx_customer_email_hash')
      .using('btree', table.emailHash.asc().nullsLast().op('bpchar_ops'))
      .where(sql`(deleted_at IS NULL)`),
    uniqueIndex('idx_customer_phone_hash')
      .using('btree', table.phoneHash.asc().nullsLast().op('bpchar_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_customers_active')
      .using('btree', table.createdAt.asc().nullsLast().op('timestamptz_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_customers_dob').using(
      'btree',
      table.dateOfBirth.asc().nullsLast().op('date_ops')
    ),
    index('idx_customers_tags').using(
      'btree',
      table.tags.asc().nullsLast().op('text_ops')
    ),
    check(
      'chk_cust_email_s7',
      sql`(email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))`
    ),
    check(
      'chk_cust_firstname_s7',
      sql`(first_name IS NULL) OR ((jsonb_typeof(first_name) = 'object'::text) AND (first_name ? 'enc'::text) AND (first_name ? 'iv'::text) AND (first_name ? 'tag'::text) AND (first_name ? 'data'::text))`
    ),
    check(
      'chk_cust_lastname_s7',
      sql`(last_name IS NULL) OR ((jsonb_typeof(last_name) = 'object'::text) AND (last_name ? 'enc'::text) AND (last_name ? 'iv'::text) AND (last_name ? 'tag'::text) AND (last_name ? 'data'::text))`
    ),
    check(
      'chk_cust_phone_s7',
      sql`(phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))`
    ),
    check(
      'chk_cust_pwd_hash',
      sql`(password_hash IS NULL) OR (password_hash ~ '^\$2[ayb]\$.+$'::text)`
    ),
    check(
      'chk_dob_past',
      sql`(date_of_birth IS NULL) OR (date_of_birth <= CURRENT_DATE)`
    ),
    check(
      'chk_total_spent_pos',
      sql`(COALESCE(total_spent_amount, (0)::numeric) >= (0)::numeric) AND (total_spent_amount IS NOT NULL)`
    ),
    check(
      'chk_wallet_bal_pos',
      sql`(COALESCE(wallet_balance, (0)::numeric) >= (0)::numeric) AND (wallet_balance IS NOT NULL) AND (wallet_balance IS NOT NULL)`
    ),
  ]
);

export const tenantConfigInStorefront = pgTable(
  'tenant_config',
  {
    key: varchar({ length: 100 }).primaryKey().notNull(),
    value: jsonb().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (_table) => [
    check('chk_config_key', sql`(key)::text ~ '^[a-zA-Z0-9_]+$'::text`),
    check('chk_tc_value_size', sql`pg_column_size(value) <= 102400`),
  ]
);

export const bannersInStorefront = pgTable(
  'banners',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    location: varchar({ length: 50 }).default('home_top').notNull(),
    imageUrl: text('image_url').notNull(),
    linkUrl: text('link_url'),
    title: jsonb(),
    content: jsonb(),
  },
  (table) => [
    index('idx_banners_active').using(
      'btree',
      table.isActive.asc().nullsLast().op('text_ops'),
      table.location.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const smartCollectionsInStorefront = pgTable(
  'smart_collections',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    matchType: varchar('match_type', { length: 5 }).default('all').notNull(),
    sortBy: varchar('sort_by', { length: 50 })
      .default('best_selling')
      .notNull(),
    imageUrl: text('image_url'),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    title: jsonb().notNull(),
    conditions: jsonb().notNull(),
  },
  (table) => [
    unique('idx_smart_collections_slug').on(table.slug),
    check(
      'chk_conditions_array',
      sql`jsonb_typeof(conditions) = 'array'::text`
    ),
    check('conditions_size', sql`pg_column_size(conditions) <= 10240`),
  ]
);

export const shippingZonesInStorefront = pgTable(
  'shipping_zones',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    basePrice: numeric('base_price', { precision: 12, scale: 4 }).notNull(),
    freeShippingThreshold: numeric('free_shipping_threshold', {
      precision: 12,
      scale: 4,
    }),
    minDeliveryDays: integer('min_delivery_days'),
    maxDeliveryDays: integer('max_delivery_days'),
    isActive: boolean('is_active').default(true).notNull(),
    name: varchar({ length: 100 }).notNull(),
    region: varchar({ length: 100 }).notNull(),
    country: char({ length: 2 }),
    carrier: varchar({ length: 50 }),
    estimatedDays: varchar('estimated_days', { length: 50 }),
  },
  (table) => [
    index('idx_shipping_active').using(
      'btree',
      table.isActive.asc().nullsLast().op('bool_ops')
    ),
    index('idx_shipping_region').using(
      'btree',
      table.region.asc().nullsLast().op('text_ops')
    ),
    check(
      'chk_delivery_logic',
      sql`(min_delivery_days >= 0) AND (min_delivery_days <= max_delivery_days)`
    ),
  ]
);

export const searchSynonymsInStorefront = pgTable(
  'search_synonyms',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    term: varchar({ length: 100 }).notNull(),
    synonyms: jsonb().notNull(),
    languageCode: char('language_code', { length: 2 }).default('ar').notNull(),
    isBidirectional: boolean('is_bidirectional').default(true).notNull(),
  },
  (table) => [
    unique('search_synonyms_term_unique').on(table.term),
    check('chk_synonym_no_self_loop', sql`NOT (synonyms ? (term)::text)`),
  ]
);

export const subscriptionPlansInGovernance = governance.table(
  'subscription_plans',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    priceMonthly: bigint('price_monthly', { mode: 'number' }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    priceYearly: bigint('price_yearly', { mode: 'number' }).notNull(),
    defaultMaxProducts: integer('default_max_products').default(50).notNull(),
    defaultMaxOrders: integer('default_max_orders').default(100).notNull(),
    defaultMaxPages: integer('default_max_pages').default(5).notNull(),
    defaultMaxStaff: integer('default_max_staff').default(3).notNull(),
    defaultMaxStorageGb: integer('default_max_storage_gb').default(1).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    code: tenantPlan().notNull(),
    name: varchar({ length: 100 }).notNull(),
    currency: varchar({ length: 3 }).default('USD').notNull(),
    description: text(),
    priceMonthlyV2: numeric('price_monthly_v2', {
      precision: 12,
      scale: 4,
    }).notNull(),
    priceYearlyV2: numeric('price_yearly_v2', {
      precision: 12,
      scale: 4,
    }).notNull(),
  },
  (table) => [
    unique('subscription_plans_code_unique').on(table.code),
    check(
      'chk_plan_price',
      sql`(COALESCE(price_monthly_v2, (0)::numeric) >= (0)::numeric) AND (COALESCE(price_yearly_v2, (0)::numeric) >= (0)::numeric)`
    ),
  ]
);

export const reviewsInStorefront = pgTable(
  'reviews',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid('product_id').notNull(),
    customerId: uuid('customer_id'),
    rating: integer().notNull(),
    comment: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    sentimentScore: numeric('sentiment_score', { precision: 3, scale: 2 }),
    isAnomalyFlagged: boolean('is_anomaly_flagged').default(false).notNull(),
    embedding: vector({ dimensions: 1536 }),
    sentimentConfidence: numeric('sentiment_confidence', {
      precision: 3,
      scale: 2,
    }),
  },
  (table) => [
    index('idx_reviews_embedding_cosine').using(
      'hnsw',
      table.embedding.asc().nullsLast().op('vector_cosine_ops')
    ),
    check('chk_rating_bounds', sql`(rating >= 1) AND (rating <= 5)`),
    check(
      'chk_sentiment_bounds',
      sql`(sentiment_score >= '-1.00'::numeric) AND (sentiment_score <= 1.00)`
    ),
  ]
);

export const productViewsInStorefront = pgTable(
  'product_views',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid('product_id').notNull(),
    customerId: uuid('customer_id'),
    sessionId: varchar('session_id', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    dwellTimeSeconds: integer('dwell_time_seconds').default(0).notNull(),
    sourceMedium: varchar('source_medium', { length: 100 }),
  },
  (table) => [
    index('idx_pv_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
  ]
);

export const popupsInStorefront = pgTable('popups', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  triggerType: varchar('trigger_type', { length: 20 })
    .default('time_on_page')
    .notNull(),
  content: jsonb().notNull(),
  settings: jsonb().notNull(),
});

export const currencyRatesInStorefront = pgTable(
  'currency_rates',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    fromCurrency: char('from_currency', { length: 3 }).notNull(),
    toCurrency: char('to_currency', { length: 3 }).notNull(),
    rate: numeric({ precision: 12, scale: 6 }).notNull(),
  },
  (table) => [
    unique('uq_tenant_currency_pair').on(table.fromCurrency, table.toCurrency),
  ]
);

export const abandonedCheckoutsInStorefront = pgTable(
  'abandoned_checkouts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    recoveredAt: timestamp('recovered_at', {
      withTimezone: true,
      mode: 'string',
    }),
    subtotal: numeric({ precision: 12, scale: 4 }),
    recoveryEmailSent: boolean('recovery_email_sent').default(false).notNull(),
    email: jsonb(),
    items: jsonb(),
    recoveryCouponCode: varchar('recovery_coupon_code', { length: 50 }),
    recoveredAmount: numeric('recovered_amount', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
  },
  (table) => [
    index('idx_abandoned_created').using(
      'btree',
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customersInStorefront.id],
      name: 'fk_ac_customer',
    }).onDelete('restrict'),
  ]
);

export const affiliatePartnersInStorefront = pgTable(
  'affiliate_partners',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    commissionRate: integer('commission_rate').default(500).notNull(),
    totalEarned: numeric('total_earned', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    totalPaid: numeric('total_paid', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    status: affiliateStatus().default('pending').notNull(),
    referralCode: varchar('referral_code', { length: 50 }).notNull(),
    email: jsonb().notNull(),
    emailHash: text('email_hash'),
    payoutDetails: jsonb('payout_details'),
  },
  (table) => [
    index('idx_affiliate_email_hash').using(
      'btree',
      table.emailHash.asc().nullsLast().op('text_ops')
    ),
    unique('affiliate_partners_referral_code_unique').on(table.referralCode),
    check(
      'chk_aff_email_s7',
      sql`(email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))`
    ),
    check(
      'chk_aff_payout_s7',
      sql`(payout_details IS NULL) OR ((jsonb_typeof(payout_details) = 'object'::text) AND (payout_details ? 'enc'::text) AND (payout_details ? 'iv'::text) AND (payout_details ? 'tag'::text) AND (payout_details ? 'data'::text))`
    ),
    check(
      'chk_aff_rate_cap',
      sql`(commission_rate >= 0) AND (commission_rate <= 10000)`
    ),
    check(
      'chk_ref_code_upper',
      sql`(referral_code)::text = upper((referral_code)::text)`
    ),
  ]
);

export const affiliateTransactionsInStorefront = pgTable(
  'affiliate_transactions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    partnerId: uuid('partner_id').notNull(),
    orderId: uuid('order_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),
    commissionAmount: numeric('commission_amount', {
      precision: 12,
      scale: 4,
    }).notNull(),
    holdPeriodEndsAt: timestamp('hold_period_ends_at', {
      withTimezone: true,
      mode: 'string',
    }),
    status: affiliateTxStatus().default('pending').notNull(),
    payoutReference: varchar('payout_reference', { length: 100 }),
  },
  (table) => [
    index('idx_aff_trans_created_brin').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_minmax_ops')
    ),
    index('idx_aff_trans_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_aff_trans_partner').using(
      'btree',
      table.partnerId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.partnerId],
      foreignColumns: [affiliatePartnersInStorefront.id],
      name: 'fk_afftx_partner',
    }).onDelete('restrict'),
    check(
      'chk_aff_comm_positive',
      sql`COALESCE(commission_amount, (0)::numeric) > (0)::numeric`
    ),
  ]
);

export const b2BCompaniesInStorefront = pgTable(
  'b2b_companies',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    creditLimit: numeric('credit_limit', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    creditUsed: numeric('credit_used', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    paymentTermsDays: integer('payment_terms_days').default(30).notNull(),
    status: b2BCompanyStatus().default('pending').notNull(),
    name: varchar({ length: 255 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }),
    industry: varchar({ length: 100 }),
    lockVersion: integer('lock_version').default(1).notNull(),
  },
  (_table) => [
    check(
      'chk_credit_limit_positive',
      sql`COALESCE(credit_limit, (0)::numeric) >= (0)::numeric`
    ),
    check(
      'chk_tax_id_len',
      sql`(tax_id IS NULL) OR (length((tax_id)::text) >= 5)`
    ),
  ]
);

export const brandsInStorefront = pgTable(
  'brands',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    isActive: boolean('is_active').default(true).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    country: char({ length: 2 }),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),
    name: jsonb().notNull(),
    description: jsonb(),
  },
  (table) => [
    index('idx_brands_active')
      .using('btree', table.isActive.asc().nullsLast().op('bool_ops'))
      .where(sql`(deleted_at IS NULL)`),
    uniqueIndex('idx_brands_slug_active')
      .using('btree', table.slug.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
  ]
);

export const categoriesInStorefront = pgTable(
  'categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    parentId: uuid('parent_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    productsCount: integer('products_count').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    icon: varchar({ length: 100 }),
    metaTitle: varchar('meta_title', { length: 150 }),
    metaDescription: varchar('meta_description', { length: 255 }),
    imageUrl: text('image_url'),
    bannerUrl: text('banner_url'),
    name: jsonb().notNull(),
    description: jsonb(),
    path: text(),
  },
  (table) => [
    index('idx_categories_active')
      .using('btree', table.isActive.asc().nullsLast().op('bool_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_categories_parent').using(
      'btree',
      table.parentId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('idx_categories_slug_active')
      .using('btree', table.slug.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'fk_cat_parent',
    }).onDelete('restrict'),
    check(
      'chk_categories_no_circular_ref',
      sql`(parent_id IS NULL) OR (parent_id <> id)`
    ),
  ]
);

export const productsInStorefront = pgTable(
  'products',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    niche: nicheType('niche').default('retail').notNull(),
    attributes: jsonb().default({}).notNull(),
    brandId: uuid('brand_id'),
    categoryId: uuid('category_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    basePrice: numeric('base_price', { precision: 12, scale: 4 }).notNull(),
    salePrice: numeric('sale_price', { precision: 12, scale: 4 }),
    costPrice: numeric('cost_price', { precision: 12, scale: 4 }),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 4 }),
    taxBasisPoints: integer('tax_basis_points').default(0).notNull(),
    lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
    soldCount: integer('sold_count').default(0).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    reviewCount: integer('review_count').default(0).notNull(),
    weight: integer(),
    minOrderQty: integer('min_order_qty').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isReturnable: boolean('is_returnable').default(true).notNull(),
    requiresShipping: boolean('requires_shipping').default(true).notNull(),
    isDigital: boolean('is_digital').default(false).notNull(),
    trackInventory: boolean('track_inventory').default(true).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    sku: varchar({ length: 100 }).notNull(),
    barcode: varchar({ length: 50 }),
    countryOfOrigin: varchar('country_of_origin', { length: 100 }),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    mainImage: text('main_image').notNull(),
    videoUrl: text('video_url'),
    digitalFileUrl: text('digital_file_url'),
    keywords: text(),
    avgRating: numeric('avg_rating', { precision: 3, scale: 2 })
      .default('0')
      .notNull(),
    tags: text().array(),
    name: jsonb().notNull(),
    shortDescription: jsonb('short_description'),
    longDescription: jsonb('long_description'),
    specifications: jsonb().default({}).notNull(),
    dimensions: jsonb(),
    galleryImages: jsonb('gallery_images').default([]).notNull(),
    embedding: vector({ dimensions: 1536 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    version: bigint({ mode: 'number' }).default(1).notNull(),
    warrantyPeriod: integer('warranty_period'),
    warrantyUnit: varchar('warranty_unit', { length: 10 }),
  },
  (table) => [
    index('idx_products_active')
      .using('btree', table.categoryId.asc().nullsLast().op('uuid_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_products_brand').using(
      'btree',
      table.brandId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_products_embedding_cosine').using(
      'hnsw',
      table.embedding.asc().nullsLast().op('vector_cosine_ops')
    ),
    index('idx_products_featured')
      .using('btree', table.isFeatured.asc().nullsLast().op('bool_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_products_name').using(
      'gin',
      table.name.asc().nullsLast().op('jsonb_ops')
    ),
    uniqueIndex('idx_products_sku_active')
      .using('btree', table.sku.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    uniqueIndex('idx_products_slug_active')
      .using('btree', table.slug.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_products_tags').using(
      'gin',
      table.tags.asc().nullsLast().op('array_ops')
    ),
    foreignKey({
      columns: [table.brandId],
      foreignColumns: [brandsInStorefront.id],
      name: 'fk_prod_brand',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categoriesInStorefront.id],
      name: 'fk_prod_cat',
    }).onDelete('restrict'),
    check(
      'chk_barcode_format',
      sql`(barcode IS NULL) OR ((barcode)::text ~ '^[A-Za-z0-9-]{8,50}$'::text)`
    ),
    check(
      'chk_compare_price',
      sql`(compare_at_price IS NULL) OR ((COALESCE(compare_at_price, (0)::numeric) > COALESCE(base_price, (0)::numeric)) AND (compare_at_price IS NOT NULL))`
    ),
    check('chk_digital_shipping', sql`NOT (is_digital AND requires_shipping)`),
    check(
      'chk_price_positive',
      sql`(COALESCE(base_price, (0)::numeric) >= (0)::numeric) AND (base_price IS NOT NULL) AND (base_price IS NOT NULL)`
    ),
    check(
      'chk_sale_price_math',
      sql`(sale_price IS NULL) OR ((COALESCE(sale_price, (0)::numeric) <= COALESCE(base_price, (0)::numeric)) AND (sale_price IS NOT NULL))`
    ),
    check('chk_specs_size', sql`pg_column_size(specifications) <= 20480`),
  ]
);

export const b2BPricingTiersInStorefront = pgTable(
  'b2b_pricing_tiers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    companyId: uuid('company_id').notNull(),
    productId: uuid('product_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    discountBasisPoints: integer('discount_basis_points'),
    name: text().notNull(),
    minQuantity: integer('min_quantity').default(1).notNull(),
    maxQuantity: integer('max_quantity'),
    price: numeric({ precision: 12, scale: 4 }),
    currency: char({ length: 3 }).default('SAR').notNull(),
    quantityRange: int4range('quantity_range').notNull(),
    lockVersion: integer('lock_version').default(1).notNull(),
  },
  (table) => [
    index('idx_b2b_pricing').using(
      'btree',
      table.companyId.asc().nullsLast().op('uuid_ops'),
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_b2b_pricing_overlap').using(
      'gist',
      table.companyId.asc().nullsLast().op('range_ops'),
      table.productId.asc().nullsLast().op('range_ops'),
      table.quantityRange.asc().nullsLast().op('range_ops')
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [b2BCompaniesInStorefront.id],
      name: 'fk_b2bpt_company',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [productsInStorefront.id],
      name: 'fk_b2bpt_product',
    }).onDelete('restrict'),
    check(
      'chk_b2b_discount_max',
      sql`(discount_basis_points IS NULL) OR (discount_basis_points <= 10000)`
    ),
    check(
      'chk_b2b_price_pos',
      sql`(price IS NULL) OR ((price >= (0)::numeric) AND (price IS NOT NULL))`
    ),
    check(
      'chk_b2b_price_xor',
      sql`(price IS NULL) <> (discount_basis_points IS NULL)`
    ),
  ]
);

export const b2BUsersInStorefront = pgTable(
  'b2b_users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    companyId: uuid('company_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    role: b2BUserRole().default('buyer').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    currency: char({ length: 3 }).default('SAR').notNull(),
  },
  (table) => [
    index('idx_b2b_user').using(
      'btree',
      table.companyId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [b2BCompaniesInStorefront.id],
      name: 'fk_b2bu_company',
    }).onDelete('restrict'),
    unique('uq_b2b_company_customer').on(table.companyId, table.customerId),
    check(
      'chk_b2b_unit_price_pos',
      sql`COALESCE(unit_price, (0)::numeric) >= (0)::numeric`
    ),
  ]
);

export const blogCategoriesInStorefront = pgTable(
  'blog_categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: jsonb().notNull(),
    slug: varchar({ length: 100 }).notNull(),
  },
  (table) => [unique('uq_tenant_blog_cat_slug').on(table.slug)]
);

export const blogPostsInStorefront = pgTable(
  'blog_posts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    readTimeMin: integer('read_time_min'),
    viewCount: integer('view_count').default(0).notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    categoryId: uuid('category_id'),
    authorName: varchar('author_name', { length: 100 }),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    featuredImage: text('featured_image'),
    tags: text().array(),
    title: jsonb().notNull(),
    excerpt: jsonb(),
    content: jsonb().notNull(),
  },
  (table) => [
    index('idx_blog_published').using(
      'btree',
      table.isPublished.asc().nullsLast().op('bool_ops')
    ),
    index('idx_blog_published_at').using(
      'btree',
      table.publishedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    uniqueIndex('idx_blog_slug_active')
      .using('btree', table.slug.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_blog_tags').using(
      'gin',
      table.tags.asc().nullsLast().op('array_ops')
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [blogCategoriesInStorefront.id],
      name: 'fk_bp_category',
    }).onDelete('set null'),
  ]
);

export const cartsInStorefront = pgTable(
  'carts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    subtotal: numeric({ precision: 12, scale: 4 }),
    sessionId: varchar('session_id', { length: 64 }),
    items: jsonb().notNull(),
    appliedCoupons: jsonb('applied_coupons'),
    lockVersion: integer('lock_version').default(1).notNull(),
  },
  (table) => [
    index('idx_carts_customer').using(
      'btree',
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_carts_expires').using(
      'btree',
      table.expiresAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_carts_session').using(
      'btree',
      table.sessionId.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customersInStorefront.id],
      name: 'fk_cart_customer',
    }).onDelete('restrict'),
    check('chk_cart_items_size', sql`pg_column_size(items) <= 51200`),
    check(
      'chk_cart_subtotal_pos',
      sql`(subtotal IS NULL) OR (COALESCE(subtotal, (0)::numeric) >= (0)::numeric)`
    ),
  ]
);

export const cartItemsInStorefront = pgTable(
  'cart_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    cartId: uuid('cart_id').notNull(),
    variantId: uuid('variant_id').notNull(),
    quantity: integer().default(1).notNull(),
    price: numeric({ precision: 12, scale: 4 }).notNull(),
    addedAt: timestamp('added_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_cart_items_cart').using(
      'btree',
      table.cartId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [cartsInStorefront.id],
      name: 'fk_ci_cart',
    }).onDelete('cascade'),
    check(
      'chk_cart_item_price',
      sql`COALESCE(price, (0)::numeric) >= (0)::numeric`
    ),
  ]
);

export const couponsInStorefront = pgTable(
  'coupons',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    value: numeric({ precision: 12, scale: 4 }).notNull(),
    minOrderAmount: numeric('min_order_amount', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').default(0).notNull(),
    maxUsesPerCustomer: integer('max_uses_per_customer'),
    isActive: boolean('is_active').default(true).notNull(),
    code: varchar({ length: 50 }).notNull(),
    type: varchar({ length: 20 }).notNull(),
    lockVersion: integer('lock_version').default(1).notNull(),
    version: integer().default(1).notNull(),
  },
  (table) => [
    index('idx_coupons_active').using(
      'btree',
      table.isActive.asc().nullsLast().op('bool_ops')
    ),
    index('idx_coupons_code').using(
      'btree',
      table.code.asc().nullsLast().op('text_ops')
    ),
    unique('coupons_code_unique').on(table.code),
    check(
      'chk_coupon_min_amount',
      sql`COALESCE(min_order_amount, (0)::numeric) >= (0)::numeric`
    ),
    check(
      'chk_coupon_pct',
      sql`((type)::text <> 'percentage'::text) OR (COALESCE(value, (0)::numeric) <= (10000)::numeric)`
    ),
    check(
      'chk_coupon_val_positive',
      sql`COALESCE(value, (0)::numeric) > (0)::numeric`
    ),
    check('coupon_code_upper_check', sql`(code)::text = upper((code)::text)`),
    check('coupon_usage_exhaustion_check', sql`used_count <= max_uses`),
  ]
);

export const couponUsagesInStorefront = pgTable(
  'coupon_usages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    couponId: uuid('coupon_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    orderId: uuid('order_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_coupon_usages_lookup').using(
      'btree',
      table.couponId.asc().nullsLast().op('uuid_ops'),
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.couponId],
      foreignColumns: [couponsInStorefront.id],
      name: 'fk_cu_coupon',
    }).onDelete('restrict'),
    unique('uq_coupon_cust_order').on(
      table.couponId,
      table.customerId,
      table.orderId
    ),
  ]
);

export const customerAddressesInStorefront = pgTable(
  'customer_addresses',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    isDefaultBilling: boolean('is_default_billing').default(false).notNull(),
    label: varchar({ length: 50 }),
    name: varchar({ length: 255 }).notNull(),
    line1: jsonb().notNull(),
    line2: jsonb(),
    city: varchar({ length: 100 }).notNull(),
    state: varchar({ length: 100 }),
    postalCode: jsonb('postal_code').notNull(),
    country: char({ length: 2 }).notNull(),
    phone: jsonb(),
    coordinates: text(),
  },
  (table) => [
    index('idx_customer_addresses_customer').using(
      'btree',
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('uq_cust_default_addr')
      .using('btree', table.customerId.asc().nullsLast().op('uuid_ops'))
      .where(sql`(is_default = true)`),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customersInStorefront.id],
      name: 'fk_addr_cust',
    }).onDelete('restrict'),
    check(
      'chk_addr_phone_encrypted',
      sql`(phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))`
    ),
    check('chk_city_not_empty', sql`length(TRIM(BOTH FROM city)) > 0`),
    check(
      'chk_line1_encrypted',
      sql`(line1 IS NULL) OR ((jsonb_typeof(line1) = 'object'::text) AND (line1 ? 'enc'::text) AND (line1 ? 'iv'::text) AND (line1 ? 'tag'::text) AND (line1 ? 'data'::text))`
    ),
    check(
      'chk_postal_code_encrypted',
      sql`(postal_code IS NULL) OR ((jsonb_typeof(postal_code) = 'object'::text) AND (postal_code ? 'enc'::text) AND (postal_code ? 'iv'::text) AND (postal_code ? 'tag'::text) AND (postal_code ? 'data'::text))`
    ),
  ]
);

export const customerConsentsInStorefront = pgTable(
  'customer_consents',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id').notNull(),
    consentedAt: timestamp('consented_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    consented: boolean().notNull(),
    channel: consentChannel().notNull(),
    source: varchar({ length: 50 }),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => [
    index('idx_consent_customer').using(
      'btree',
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customersInStorefront.id],
      name: 'fk_consent_cust',
    }).onDelete('restrict'),
  ]
);

export const priceRulesInStorefront = pgTable(
  'price_rules',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
    endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),
    value: numeric({ precision: 12, scale: 4 }).notNull(),
    minPurchaseAmount: numeric('min_purchase_amount', {
      precision: 12,
      scale: 4,
    }),
    minQuantity: integer('min_quantity'),
    maxUses: integer('max_uses'),
    maxUsesPerCustomer: integer('max_uses_per_customer'),
    usedCount: integer('used_count').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    type: discountType().notNull(),
    appliesTo: discountAppliesTo('applies_to').default('all').notNull(),
    title: jsonb().notNull(),
    entitledIds: jsonb('entitled_ids'),
    combinesWith: jsonb('combines_with'),
    lockVersion: integer('lock_version').default(1).notNull(),
  },
  (table) => [
    index('idx_price_rules_active').using(
      'btree',
      table.isActive.asc().nullsLast().op('bool_ops')
    ),
    check(
      'chk_entitled_array',
      sql`(entitled_ids IS NULL) OR (jsonb_typeof(entitled_ids) = 'array'::text)`
    ),
    check(
      'chk_entitled_len',
      sql`(entitled_ids IS NULL) OR (jsonb_array_length(entitled_ids) <= 5000)`
    ),
    check('chk_pr_dates', sql`(ends_at IS NULL) OR (ends_at > starts_at)`),
  ]
);

export const discountCodesInStorefront = pgTable(
  'discount_codes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    priceRuleId: uuid('price_rule_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    usedCount: integer('used_count').default(0).notNull(),
    code: varchar({ length: 50 }).notNull(),
  },
  (table) => [
    index('idx_discount_code').using(
      'btree',
      table.code.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.priceRuleId],
      foreignColumns: [priceRulesInStorefront.id],
      name: 'fk_dc_price_rule',
    }).onDelete('restrict'),
    unique('discount_codes_code_unique').on(table.code),
    check(
      'chk_code_strict',
      sql`((code)::text = upper((code)::text)) AND ((code)::text ~ '^[A-Z0-9_-]+$'::text)`
    ),
  ]
);

export const faqCategoriesInStorefront = pgTable('faq_categories', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 100 }).notNull(),
  order: integer().default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const faqsInStorefront = pgTable(
  'faqs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    categoryId: uuid('category_id'),
    question: varchar({ length: 500 }).notNull(),
    answer: text().notNull(),
    order: integer().default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_faq_active').using(
      'btree',
      table.isActive.asc().nullsLast().op('bool_ops')
    ),
    index('idx_faq_category').using(
      'btree',
      table.categoryId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [faqCategoriesInStorefront.id],
      name: 'fk_faq_category',
    }).onDelete('set null'),
  ]
);

export const flashSalesInStorefront = pgTable(
  'flash_sales',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    endTime: timestamp('end_time', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    timezone: varchar({ length: 50 }).default('UTC').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    name: jsonb().notNull(),
    status: varchar({ length: 20 }).default('active').notNull(),
  },
  (table) => [
    index('idx_flash_sales_end_time').using(
      'btree',
      table.endTime.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_flash_sales_status').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops')
    ),
    check('chk_flash_time', sql`end_time > starts_at`),
  ]
);

export const flashSaleProductsInStorefront = pgTable(
  'flash_sale_products',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    flashSaleId: uuid('flash_sale_id'),
    productId: uuid('product_id'),
    discountBasisPoints: integer('discount_basis_points').notNull(),
    quantityLimit: integer('quantity_limit').notNull(),
    soldQuantity: integer('sold_quantity').default(0).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    validDuring: tstzrange('valid_during'),
  },
  (table) => [
    index('idx_flash_sale_product_overlap').using(
      'gist',
      table.productId.asc().nullsLast().op('range_ops'),
      table.validDuring.asc().nullsLast().op('gist_uuid_ops')
    ),
    index('idx_fs_prod_campaign').using(
      'btree',
      table.flashSaleId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_fs_prod_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.flashSaleId],
      foreignColumns: [flashSalesInStorefront.id],
      name: 'fk_fsp_flash_sale',
    }).onDelete('restrict'),
    check('chk_flash_limit', sql`sold_quantity <= quantity_limit`),
  ]
);

export const ordersInStorefront = pgTable(
  'orders',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id'),
    marketId: uuid('market_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    shippedAt: timestamp('shipped_at', { withTimezone: true, mode: 'string' }),
    deliveredAt: timestamp('delivered_at', {
      withTimezone: true,
      mode: 'string',
    }),
    cancelledAt: timestamp('cancelled_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    subtotal: numeric({ precision: 12, scale: 4 }).notNull(),
    discount: numeric({ precision: 12, scale: 4 }).default('0').notNull(),
    shipping: numeric({ precision: 12, scale: 4 }).default('0').notNull(),
    tax: numeric({ precision: 12, scale: 4 }).default('0').notNull(),
    total: numeric({ precision: 12, scale: 4 }).notNull(),
    couponDiscount: numeric('coupon_discount', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    refundedAmount: numeric('refunded_amount', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    riskScore: integer('risk_score'),
    isFlagged: boolean('is_flagged').default(false).notNull(),
    status: orderStatus().default('pending').notNull(),
    paymentStatus: paymentStatus('payment_status').default('pending').notNull(),
    paymentMethod: paymentMethod('payment_method'),
    source: orderSource().default('web').notNull(),
    orderNumber: varchar('order_number', { length: 20 }).notNull(),
    couponCode: varchar('coupon_code', { length: 50 }),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    guestEmail: varchar('guest_email', { length: 255 }),
    cancelReason: text('cancel_reason'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    trackingUrl: text('tracking_url'),
    notes: text(),
    tags: text(),
    shippingAddress: jsonb('shipping_address').notNull(),
    billingAddress: jsonb('billing_address').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    version: bigint({ mode: 'number' }).default(1).notNull(),
    lockVersion: integer('lock_version').default(1).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    deviceFingerprint: varchar('device_fingerprint', { length: 64 }),
    paymentGatewayReference: varchar('payment_gateway_reference', {
      length: 255,
    }),
  },
  (table) => [
    index('idx_orders_admin')
      .using(
        'btree',
        table.status.asc().nullsLast().op('timestamptz_ops'),
        table.createdAt.asc().nullsLast().op('timestamptz_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_orders_created').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_minmax_ops')
    ),
    index('idx_orders_customer').using(
      'btree',
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('idx_orders_idempotency')
      .using('btree', table.idempotencyKey.asc().nullsLast().op('text_ops'))
      .where(sql`(idempotency_key IS NOT NULL)`),
    uniqueIndex('idx_orders_number_active')
      .using('btree', table.orderNumber.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_orders_payment_ref')
      .using(
        'btree',
        table.paymentGatewayReference.asc().nullsLast().op('text_ops')
      )
      .where(sql`(payment_gateway_reference IS NOT NULL)`),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customersInStorefront.id],
      name: 'fk_ord_customer',
    }).onDelete('restrict'),
    check(
      'chk_checkout_math',
      sql`(COALESCE(total, (0)::numeric) = ((((COALESCE(subtotal, (0)::numeric) + COALESCE(tax, (0)::numeric)) + COALESCE(shipping, (0)::numeric)) - COALESCE(discount, (0)::numeric)) - COALESCE(coupon_discount, (0)::numeric))) AND (COALESCE(total, (0)::numeric) >= (0)::numeric)`
    ),
    check(
      'chk_order_total_inner',
      sql`(total IS NOT NULL) AND (subtotal IS NOT NULL)`
    ),
    check(
      'chk_positive_costs',
      sql`(COALESCE(shipping, (0)::numeric) >= (0)::numeric) AND (COALESCE(tax, (0)::numeric) >= (0)::numeric)`
    ),
    check(
      'chk_refund_cap',
      sql`COALESCE(refunded_amount, (0)::numeric) <= COALESCE(total, (0)::numeric)`
    ),
  ]
);

export const fulfillmentsInStorefront = pgTable(
  'fulfillments',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id').notNull(),
    locationId: uuid('location_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    shippedAt: timestamp('shipped_at', { withTimezone: true, mode: 'string' }),
    deliveredAt: timestamp('delivered_at', {
      withTimezone: true,
      mode: 'string',
    }),
    status: fulfillmentStatus().default('pending').notNull(),
    trackingCompany: varchar('tracking_company', { length: 100 }),
    trackingDetails: jsonb('tracking_details'),
  },
  (table) => [
    index('idx_fulfillments_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'fk_ful_order',
    }).onDelete('restrict'),
  ]
);

export const productVariantsInStorefront = pgTable(
  'product_variants',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid('product_id').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    price: numeric({ precision: 12, scale: 4 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 4 }),
    weight: integer(),
    version: integer().default(1).notNull(),
    sku: varchar({ length: 100 }).notNull(),
    barcode: varchar({ length: 50 }),
    weightUnit: varchar('weight_unit', { length: 5 }).default('g').notNull(),
    imageUrl: text('image_url'),
    options: jsonb().notNull(),
    embedding: vector({ dimensions: 1536 }),
  },
  (table) => [
    uniqueIndex('idx_variant_sku_active')
      .using('btree', table.sku.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_variants_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [productsInStorefront.id],
      name: 'fk_var_prod',
    }).onDelete('restrict'),
    check(
      'chk_variant_compare_price',
      sql`(compare_at_price IS NULL) OR (compare_at_price IS NOT NULL)`
    ),
    check(
      'chk_variant_options_obj',
      sql`jsonb_typeof(options) = 'object'::text`
    ),
    check(
      'chk_variant_price_pos',
      sql`(price >= (0)::numeric) AND (price IS NOT NULL) AND (price IS NOT NULL)`
    ),
  ]
);

export const orderItemsInStorefront = pgTable(
  'order_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id').notNull(),
    productId: uuid('product_id'),
    variantId: uuid('variant_id'),
    price: numeric({ precision: 12, scale: 4 }).notNull(),
    costPrice: numeric('cost_price', { precision: 12, scale: 4 }),
    total: numeric({ precision: 12, scale: 4 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    quantity: integer().notNull(),
    fulfilledQuantity: integer('fulfilled_quantity').default(0).notNull(),
    returnedQuantity: integer('returned_quantity').default(0).notNull(),
    name: varchar({ length: 255 }).notNull(),
    sku: varchar({ length: 100 }),
    imageUrl: text('image_url'),
    attributes: jsonb(),
    taxLines: jsonb('tax_lines').default([]).notNull(),
    discountAllocations: jsonb('discount_allocations').default([]).notNull(),
  },
  (table) => [
    index('idx_oi_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_order_items_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'fk_oi_order',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariantsInStorefront.id],
      name: 'fk_oi_variant',
    }).onDelete('restrict'),
    check('chk_fulfill_qty', sql`fulfilled_quantity <= quantity`),
    check(
      'chk_item_discount_logic',
      sql`COALESCE(discount_amount, (0)::numeric) <= (COALESCE(price, (0)::numeric) * (quantity)::numeric)`
    ),
    check(
      'chk_item_inner_not_null',
      sql`(price IS NOT NULL) AND (total IS NOT NULL)`
    ),
    check(
      'chk_item_math',
      sql`COALESCE(total, (0)::numeric) = (((COALESCE(price, (0)::numeric) * (quantity)::numeric) - COALESCE(discount_amount, (0)::numeric)) + COALESCE(tax_amount, (0)::numeric))`
    ),
    check('chk_returned_qty', sql`returned_quantity <= fulfilled_quantity`),
    check('qty_positive', sql`quantity > 0`),
  ]
);

export const fulfillmentItemsInStorefront = pgTable(
  'fulfillment_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    fulfillmentId: uuid('fulfillment_id').notNull(),
    orderItemId: uuid('order_item_id').notNull(),
    quantity: integer().notNull(),
  },
  (table) => [
    index('idx_fulfill_items').using(
      'btree',
      table.fulfillmentId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.fulfillmentId],
      foreignColumns: [fulfillmentsInStorefront.id],
      name: 'fk_fi_fulfillment',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.orderItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_fi_order_item',
    }).onDelete('restrict'),
  ]
);

export const locationsInStorefront = pgTable('locations', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  type: locationType().default('warehouse').notNull(),
  name: jsonb().notNull(),
  address: jsonb(),
  coordinates: text(),
});

export const inventoryLevelsInStorefront = pgTable(
  'inventory_levels',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    locationId: uuid('location_id').notNull(),
    variantId: uuid('variant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    available: integer().default(0).notNull(),
    reserved: integer().default(0).notNull(),
    incoming: integer().default(0).notNull(),
    version: integer().default(1).notNull(),
  },
  (table) => [
    index('idx_inv_variant').using(
      'btree',
      table.variantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locationsInStorefront.id],
      name: 'fk_inv_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariantsInStorefront.id],
      name: 'fk_inv_variant',
    }).onDelete('restrict'),
    unique('uq_inventory_loc_var').on(table.locationId, table.variantId),
    check('chk_available', sql`available >= 0`),
    check('chk_incoming_positive', sql`incoming >= 0`),
    check('chk_reserved', sql`reserved >= 0`),
    check('chk_reserved_logic', sql`reserved <= available`),
  ]
);

export const inventoryMovementsInStorefront = pgTable(
  'inventory_movements',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    variantId: uuid('variant_id').notNull(),
    locationId: uuid('location_id').notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    type: inventoryMovementType().notNull(),
    quantity: integer().notNull(),
    reason: text(),
    referenceId: uuid('reference_id'),
  },
  (table) => [
    index('idx_inv_mov_created').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_minmax_ops')
    ),
    index('idx_inv_mov_variant').using(
      'btree',
      table.variantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locationsInStorefront.id],
      name: 'fk_im_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariantsInStorefront.id],
      name: 'fk_im_variant',
    }).onDelete('restrict'),
    check(
      'chk_adj_reason',
      sql`(type <> 'adjustment'::inventory_movement_type) OR (reference_id IS NOT NULL)`
    ),
    check(
      'chk_movement_logic',
      sql`((type = 'in'::inventory_movement_type) AND (quantity > 0)) OR ((type = 'out'::inventory_movement_type) AND (quantity < 0)) OR (type = ANY (ARRAY['adjustment'::inventory_movement_type, 'transfer'::inventory_movement_type, 'return'::inventory_movement_type]))`
    ),
    check(
      'chk_return_positive',
      sql`(type <> 'return'::inventory_movement_type) OR (quantity > 0)`
    ),
  ]
);

export const inventoryReservationsInStorefront = pgTable(
  'inventory_reservations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    variantId: uuid('variant_id').notNull(),
    locationId: uuid('location_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    status: reservationStatus().default('active').notNull(),
    cartId: uuid('cart_id'),
    quantity: integer().notNull(),
  },
  (table) => [
    index('idx_inv_res_active')
      .using('btree', table.status.asc().nullsLast().op('enum_ops'))
      .where(sql`(status = 'active'::reservation_status)`),
    index('idx_inv_res_cron')
      .using('btree', table.expiresAt.asc().nullsLast().op('timestamptz_ops'))
      .where(sql`(status = 'active'::reservation_status)`),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locationsInStorefront.id],
      name: 'fk_ir_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariantsInStorefront.id],
      name: 'fk_ir_variant',
    }).onDelete('restrict'),
    check('chk_res_qty_limit', sql`quantity <= 100`),
    check(
      'chk_res_time_bound',
      sql`expires_at <= (created_at + '7 days'::interval)`
    ),
  ]
);

export const inventoryTransfersInStorefront = pgTable(
  'inventory_transfers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    fromLocationId: uuid('from_location_id').notNull(),
    toLocationId: uuid('to_location_id').notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    expectedArrival: timestamp('expected_arrival', {
      withTimezone: true,
      mode: 'string',
    }),
    status: transferStatus().default('draft').notNull(),
    notes: text(),
    version: integer().default(1).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.fromLocationId],
      foreignColumns: [locationsInStorefront.id],
      name: 'fk_it_from_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.toLocationId],
      foreignColumns: [locationsInStorefront.id],
      name: 'fk_it_to_loc',
    }).onDelete('restrict'),
    check(
      'chk_transfer_future',
      sql`(expected_arrival IS NULL) OR (expected_arrival >= created_at)`
    ),
    check('chk_transfer_locations', sql`from_location_id <> to_location_id`),
  ]
);

export const inventoryTransferItemsInStorefront = pgTable(
  'inventory_transfer_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    transferId: uuid('transfer_id').notNull(),
    variantId: uuid('variant_id').notNull(),
    quantity: integer().notNull(),
  },
  (table) => [
    index('idx_transfer_items').using(
      'btree',
      table.transferId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.transferId],
      foreignColumns: [inventoryTransfersInStorefront.id],
      name: 'fk_iti_transfer',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariantsInStorefront.id],
      name: 'fk_iti_variant',
    }).onDelete('restrict'),
  ]
);

export const orderEditsInStorefront = pgTable(
  'order_edits',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id').notNull(),
    lineItemId: uuid('line_item_id'),
    editedBy: uuid('edited_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    amountChange: numeric('amount_change', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    editType: varchar('edit_type', { length: 30 }).notNull(),
    reason: text(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
  },
  (table) => [
    index('idx_order_edits').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.lineItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_oe_line_item',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'fk_oe_order',
    }).onDelete('restrict'),
  ]
);

export const kbCategoriesInStorefront = pgTable(
  'kb_categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    icon: varchar({ length: 50 }),
    order: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique('kb_categories_slug_unique').on(table.slug)]
);

export const kbArticlesInStorefront = pgTable(
  'kb_articles',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    categoryId: uuid('category_id'),
    slug: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_kb_article_slug').using(
      'btree',
      table.slug.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [kbCategoriesInStorefront.id],
      name: 'fk_kba_category',
    }).onDelete('restrict'),
    unique('kb_articles_slug_unique').on(table.slug),
  ]
);

export const orderTimelineInStorefront = pgTable(
  'order_timeline',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    status: varchar({ length: 50 }).notNull(),
    title: jsonb(),
    notes: text(),
    location: jsonb(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
  },
  (table) => [
    index('idx_timeline_created').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_minmax_ops')
    ),
    index('idx_timeline_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'fk_ot_order',
    }).onDelete('restrict'),
  ]
);

export const productBundleItemsInStorefront = pgTable(
  'product_bundle_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    bundleId: uuid('bundle_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer().default(1).notNull(),
  },
  (table) => [
    index('idx_bundle_items').using(
      'btree',
      table.bundleId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.bundleId],
      foreignColumns: [productBundlesInStorefront.id],
      name: 'fk_pbi_bundle',
    }).onDelete('restrict'),
  ]
);

export const marketsInStorefront = pgTable(
  'markets',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    defaultCurrency: char('default_currency', { length: 3 }).notNull(),
    defaultLanguage: char('default_language', { length: 2 })
      .default('ar')
      .notNull(),
    name: jsonb().notNull(),
    countries: jsonb().notNull(),
  },
  (table) => [
    uniqueIndex('uq_tenant_primary_market')
      .using('btree', table.id.asc().nullsLast().op('uuid_ops'))
      .where(sql`(is_primary = true)`),
  ]
);

export const priceListsInStorefront = pgTable(
  'price_lists',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    marketId: uuid('market_id').notNull(),
    productId: uuid('product_id'),
    variantId: uuid('variant_id'),
    quantityRange: int4range('quantity_range').notNull(),
    price: numeric({ precision: 12, scale: 4 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 4 }),
  },
  (table) => [
    index('idx_price_list_overlap').using(
      'gist',
      table.productId.asc().nullsLast().op('range_ops'),
      table.variantId.asc().nullsLast().op('range_ops'),
      table.marketId.asc().nullsLast().op('gist_uuid_ops'),
      table.quantityRange.asc().nullsLast().op('gist_uuid_ops')
    ),
    foreignKey({
      columns: [table.marketId],
      foreignColumns: [marketsInStorefront.id],
      name: 'fk_pl_market',
    }).onDelete('restrict'),
    check(
      'chk_pl_inner_not_null',
      sql`(price IS NOT NULL) AND (price IS NOT NULL)`
    ),
    check(
      'chk_pl_price_inner',
      sql`(price IS NOT NULL) AND (price IS NOT NULL)`
    ),
  ]
);

export const productAttributesInStorefront = pgTable(
  'product_attributes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid('product_id').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    attributeName: varchar('attribute_name', { length: 100 }).notNull(),
    attributeValue: text('attribute_value').notNull(),
    attributeGroup: varchar('attribute_group', { length: 100 }),
  },
  (table) => [
    index('idx_attrs_product').using(
      'btree',
      table.productId.asc().nullsLast().op('text_ops'),
      table.attributeName.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [productsInStorefront.id],
      name: 'fk_attr_prod',
    }).onDelete('cascade'),
    unique('uq_tenant_product_attr').on(table.productId, table.attributeName),
    check('chk_attr_val_len', sql`length(attribute_value) <= 1024`),
  ]
);

export const productBundlesInStorefront = pgTable(
  'product_bundles',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
    endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),
    discountValue: numeric('discount_value', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    discountType: varchar('discount_type', { length: 20 })
      .default('percentage')
      .notNull(),
    name: jsonb().notNull(),
  },
  (_table) => [
    check(
      'chk_bundle_discount_positive',
      sql`COALESCE(discount_value, (0)::numeric) >= (0)::numeric`
    ),
  ]
);

export const productImagesInStorefront = pgTable(
  'product_images',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid('product_id').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    url: text().notNull(),
    altText: varchar('alt_text', { length: 255 }),
  },
  (table) => [
    index('idx_product_images_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('uq_primary_image')
      .using('btree', table.productId.asc().nullsLast().op('uuid_ops'))
      .where(sql`(is_primary = true)`),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [productsInStorefront.id],
      name: 'fk_img_prod',
    }).onDelete('cascade'),
  ]
);

export const purchaseOrdersInStorefront = pgTable(
  'purchase_orders',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    supplierId: uuid('supplier_id').notNull(),
    locationId: uuid('location_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    expectedArrival: timestamp('expected_arrival', {
      withTimezone: true,
      mode: 'string',
    }),
    status: purchaseOrderStatus().default('draft').notNull(),
    subtotal: numeric({ precision: 12, scale: 4 }).notNull(),
    tax: numeric({ precision: 12, scale: 4 }).default('0').notNull(),
    shippingCost: numeric('shipping_cost', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    total: numeric({ precision: 12, scale: 4 }).notNull(),
    orderNumber: varchar('order_number', { length: 20 }),
    notes: text(),
  },
  (table) => [
    index('idx_po_status').using(
      'btree',
      table.status.asc().nullsLast().op('enum_ops')
    ),
    index('idx_po_supplier').using(
      'btree',
      table.supplierId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locationsInStorefront.id],
      name: 'fk_po_location',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.supplierId],
      foreignColumns: [suppliersInStorefront.id],
      name: 'fk_po_supplier',
    }).onDelete('restrict'),
    unique('idx_po_number_unique').on(table.orderNumber),
    check(
      'chk_po_inner_not_null',
      sql`(total IS NOT NULL) AND (subtotal IS NOT NULL)`
    ),
    check(
      'chk_po_math',
      sql`COALESCE(total, (0)::numeric) = ((COALESCE(subtotal, (0)::numeric) + COALESCE(tax, (0)::numeric)) + COALESCE(shipping_cost, (0)::numeric))`
    ),
  ]
);

export const suppliersInStorefront = pgTable(
  'suppliers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    leadTimeDays: integer('lead_time_days').default(7).notNull(),
    currency: char({ length: 3 }).default('USD').notNull(),
    name: text().notNull(),
    email: jsonb(),
    phone: jsonb(),
    company: jsonb(),
    notes: text(),
    address: jsonb(),
  },
  (_table) => [
    check(
      'chk_sup_company_s7',
      sql`(company IS NULL) OR ((jsonb_typeof(company) = 'object'::text) AND (company ? 'enc'::text) AND (company ? 'iv'::text) AND (company ? 'tag'::text) AND (company ? 'data'::text))`
    ),
    check(
      'chk_sup_email_s7',
      sql`(email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text))`
    ),
    check(
      'chk_sup_phone_s7',
      sql`(phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))`
    ),
  ]
);

export const purchaseOrderItemsInStorefront = pgTable(
  'purchase_order_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    poId: uuid('po_id').notNull(),
    variantId: uuid('variant_id').notNull(),
    quantityOrdered: integer('quantity_ordered').notNull(),
    quantityReceived: integer('quantity_received').default(0).notNull(),
    unitCost: numeric('unit_cost', { precision: 12, scale: 4 }).notNull(),
  },
  (table) => [
    index('idx_po_items').using(
      'btree',
      table.poId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.poId],
      foreignColumns: [purchaseOrdersInStorefront.id],
      name: 'fk_poi_po',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariantsInStorefront.id],
      name: 'fk_poi_variant',
    }).onDelete('restrict'),
    check('chk_po_receive', sql`quantity_received <= quantity_ordered`),
    check('qty_positive', sql`quantity_ordered > 0`),
  ]
);

export const rmaItemsInStorefront = pgTable(
  'rma_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    rmaId: uuid('rma_id').notNull(),
    orderItemId: uuid('order_item_id').notNull(),
    quantity: integer().notNull(),
    restockingFee: numeric('restocking_fee', { precision: 12, scale: 4 })
      .default('0')
      .notNull(),
    reasonCode: varchar('reason_code', { length: 50 }).notNull(),
    condition: varchar({ length: 20 }).notNull(),
    resolution: varchar({ length: 20 }),
  },
  (table) => [
    index('idx_rma_items_rma').using(
      'btree',
      table.rmaId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_rmai_order_item',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.rmaId],
      foreignColumns: [rmaRequestsInStorefront.id],
      name: 'fk_rmai_rma',
    }).onDelete('restrict'),
    check('qty_positive', sql`quantity > 0`),
  ]
);

export const refundsInStorefront = pgTable(
  'refunds',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id').notNull(),
    refundedBy: uuid('refunded_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    amount: numeric({ precision: 12, scale: 4 }).notNull(),
    status: refundStatus().default('pending').notNull(),
    gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
    reason: text(),
  },
  (table) => [
    index('idx_refunds_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'fk_ref_order',
    }).onDelete('restrict'),
    check(
      'chk_refund_positive',
      sql`COALESCE(amount, (0)::numeric) > (0)::numeric`
    ),
  ]
);

export const refundItemsInStorefront = pgTable(
  'refund_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    refundId: uuid('refund_id').notNull(),
    orderItemId: uuid('order_item_id').notNull(),
    quantity: integer().notNull(),
    amount: numeric({ precision: 12, scale: 4 }).notNull(),
  },
  (table) => [
    index('idx_refund_items').using(
      'btree',
      table.refundId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_ri_order_item',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.refundId],
      foreignColumns: [refundsInStorefront.id],
      name: 'fk_ri_refund',
    }).onDelete('restrict'),
    check(
      'chk_refund_item_amt',
      sql`(COALESCE(amount, (0)::numeric) > (0)::numeric) AND (quantity > 0)`
    ),
  ]
);

export const rmaRequestsInStorefront = pgTable(
  'rma_requests',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id').notNull(),
    orderItemId: uuid('order_item_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    reasonCode: rmaReasonCode('reason_code').notNull(),
    condition: rmaCondition().default('new').notNull(),
    resolution: rmaResolution().default('refund').notNull(),
    status: varchar({ length: 20 }).default('pending').notNull(),
    description: text(),
    evidence: jsonb().default([]).notNull(),
  },
  (table) => [
    index('idx_rma_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_rma_status').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'fk_rma_order',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.orderItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_rma_order_item',
    }).onDelete('restrict'),
  ]
);

export const staffRolesInStorefront = pgTable('staff_roles', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  permissions: jsonb().notNull(),
});

export const staffMembersInStorefront = pgTable(
  'staff_members',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    roleId: uuid('role_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp('last_login_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    isActive: boolean('is_active').default(true).notNull(),
    deactivatedAt: timestamp('deactivated_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deactivatedBy: uuid('deactivated_by'),
    email: jsonb().notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    avatarUrl: text('avatar_url'),
    phone: jsonb(),
    is2FaEnabled: boolean('is_2fa_enabled').default(false).notNull(),
    twoFactorSecret: jsonb('two_factor_secret'),
  },
  (table) => [
    index('idx_staff_active')
      .using('btree', table.isActive.asc().nullsLast().op('bool_ops'))
      .where(sql`(is_active = true)`),
    index('idx_staff_user').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [staffRolesInStorefront.id],
      name: 'fk_sm_role',
    }).onDelete('restrict'),
    check(
      'chk_staff_2fa_s7',
      sql`(two_factor_secret IS NULL) OR ((jsonb_typeof(two_factor_secret) = 'object'::text) AND (two_factor_secret ? 'enc'::text) AND (two_factor_secret ? 'iv'::text) AND (two_factor_secret ? 'tag'::text) AND (two_factor_secret ? 'data'::text))`
    ),
    check(
      'chk_staff_email_s7',
      sql`(jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text)`
    ),
    check(
      'chk_staff_phone_s7',
      sql`(phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text))`
    ),
  ]
);

export const staffSessionsInStorefront = pgTable(
  'staff_sessions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    staffId: uuid('staff_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    lastActiveAt: timestamp('last_active_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    deviceFingerprint: varchar('device_fingerprint', { length: 64 }),
    ipAddress: inet('ip_address'),
    asn: varchar({ length: 50 }),
    ipCountry: char('ip_country', { length: 2 }),
    userAgent: text('user_agent'),
    sessionSaltVersion: integer('session_salt_version').default(1).notNull(),
  },
  (table) => [
    index('idx_session_active')
      .using('btree', table.staffId.asc().nullsLast().op('uuid_ops'))
      .where(sql`(revoked_at IS NULL)`),
    index('idx_session_revocation_lookup').using(
      'btree',
      table.staffId.asc().nullsLast().op('text_ops'),
      table.deviceFingerprint.asc().nullsLast().op('text_ops'),
      table.revokedAt.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.staffId],
      foreignColumns: [staffMembersInStorefront.id],
      name: 'fk_ss_staff',
    }).onDelete('cascade'),
    unique('staff_sessions_token_hash_unique').on(table.tokenHash),
  ]
);

export const usersInGovernance = governance.table(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: jsonb().notNull(),
    emailHash: text('email_hash').notNull(),
    passwordHash: text('password_hash').notNull(),
    roles: text().array().default(['merchant']).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('users_email_hash_unique').on(table.emailHash),
    index('idx_users_email_hash').on(table.emailHash),
    check(
      'chk_user_email_s7',
      sql`(jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text)`
    ),
    check('chk_user_pwd_hash', sql`password_hash ~ '^\\$2[ayb]\\$.+$'::text`),
  ]
);

export const tenantsInGovernance = governance.table(
  'tenants',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    trialEndsAt: timestamp('trial_ends_at', {
      withTimezone: true,
      mode: 'string',
    }),
    suspendedAt: timestamp('suspended_at', {
      withTimezone: true,
      mode: 'string',
    }),
    plan: tenantPlan().default('free').notNull(),
    status: tenantStatus().default('active').notNull(),
    subdomain: text().notNull(),
    customDomain: text('custom_domain'),
    name: text().notNull(),
    ownerEmail: jsonb('owner_email'),
    ownerEmailHash: text('owner_email_hash'),
    suspendedReason: text('suspended_reason'),
    nicheType: text('niche_type').default('retail').notNull(),
    nicheTypeHash: text('niche_type_hash'),
    uiConfig: jsonb('ui_config').default({}).notNull(),
    dataRegion: char('data_region', { length: 2 }).default('SA').notNull(),
    timezone: varchar({ length: 50 }).default('UTC').notNull(),
  },
  (table) => [
    index('idx_tenants_email_hash').using(
      'btree',
      table.ownerEmailHash.asc().nullsLast().op('text_ops')
    ),
    uniqueIndex('tenants_custom_domain_unique')
      .using('btree', table.customDomain.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    uniqueIndex('tenants_subdomain_unique')
      .using('btree', table.subdomain.asc().nullsLast().op('text_ops'))
      .where(sql`(deleted_at IS NULL)`),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check(
      'chk_owner_email_s7',
      sql`(owner_email IS NULL) OR ((jsonb_typeof(owner_email) = 'object'::text) AND (owner_email ? 'enc'::text) AND (owner_email ? 'iv'::text) AND (owner_email ? 'tag'::text) AND (owner_email ? 'data'::text))`
    ),
    check('chk_ui_config_size', sql`pg_column_size(ui_config) <= 204800`),
  ]
);

export const taxCategoriesInStorefront = pgTable('tax_categories', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  priority: integer().default(0).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  name: varchar({ length: 100 }).notNull(),
  code: varchar({ length: 50 }),
  description: text(),
});

export const taxRulesInStorefront = pgTable(
  'tax_rules',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    taxCategoryId: uuid('tax_category_id'),
    rate: integer().notNull(),
    priority: integer().default(0).notNull(),
    isInclusive: boolean('is_inclusive').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    name: varchar({ length: 100 }).notNull(),
    country: char({ length: 2 }).notNull(),
    state: varchar({ length: 100 }),
    zipCode: varchar('zip_code', { length: 20 }),
    appliesTo: varchar('applies_to', { length: 20 }).default('all').notNull(),
    taxType: varchar('tax_type', { length: 50 }).default('VAT').notNull(),
    roundingRule: varchar('rounding_rule', { length: 20 })
      .default('half_even')
      .notNull(),
  },
  (table) => [
    index('idx_tax_rules_country').using(
      'btree',
      table.country.asc().nullsLast().op('bpchar_ops')
    ),
    foreignKey({
      columns: [table.taxCategoryId],
      foreignColumns: [taxCategoriesInStorefront.id],
      name: 'fk_tr_tax_category',
    }).onDelete('restrict'),
    unique('uq_tax_rule').on(
      table.country,
      table.state,
      table.zipCode,
      table.taxType
    ),
    check('chk_tax_rate_bounds', sql`(rate >= 0) AND (rate <= 10000)`),
    check(
      'chk_tax_rounding',
      sql`(rounding_rule)::text = ANY (ARRAY[('half_even'::character varying)::text, ('half_up'::character varying)::text, ('half_down'::character varying)::text])`
    ),
  ]
);

export const orderFraudScoresInGovernance = governance.table(
  'order_fraud_scores',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    riskScore: integer('risk_score').notNull(),
    isFlagged: boolean('is_flagged').default(false).notNull(),
    isReviewed: boolean('is_reviewed').default(false).notNull(),
    reviewedBy: text('reviewed_by'),
    decision: text(),
    provider: text().default('internal').notNull(),
    mlModelVersion: varchar('ml_model_version', { length: 50 })
      .default('v1.0.0')
      .notNull(),
    signals: jsonb().notNull(),
  },
  (table) => [
    index('idx_fraud_flagged')
      .using('btree', table.isFlagged.asc().nullsLast().op('bool_ops'))
      .where(sql`((is_flagged = true) AND (is_reviewed = false))`),
    index('idx_fraud_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_fraud_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_order_fraud_scores_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_order_fraud_scores_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)`,
    }),
    check(
      'chk_risk_score_range',
      sql`(risk_score >= 0) AND (risk_score <= 1000)`
    ),
  ]
);

export const appInstallationsInStorefront = pgTable(
  'app_installations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    installedAt: timestamp('installed_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    appName: varchar('app_name', { length: 255 }).notNull(),
    apiKey: jsonb('api_key'),
    accessToken: jsonb('access_token'),
    apiSecretHash: char('api_secret_hash', { length: 64 }),
    webhookUrl: text('webhook_url'),
    scopes: jsonb(),
    keyRotatedAt: timestamp('key_rotated_at', {
      withTimezone: true,
      mode: 'string',
    }),
  },
  (_table) => [
    check(
      'chk_app_key_s7',
      sql`(api_key IS NULL) OR ((jsonb_typeof(api_key) = 'object'::text) AND (api_key ? 'enc'::text) AND (api_key ? 'iv'::text) AND (api_key ? 'tag'::text) AND (api_key ? 'data'::text))`
    ),
    check(
      'chk_app_token_s7',
      sql`(access_token IS NULL) OR ((jsonb_typeof(access_token) = 'object'::text) AND (access_token ? 'enc'::text) AND (access_token ? 'iv'::text) AND (access_token ? 'tag'::text) AND (access_token ? 'data'::text))`
    ),
    check(
      'chk_scopes_structure',
      sql`(scopes IS NULL) OR (jsonb_typeof(scopes) = 'array'::text)`
    ),
  ]
);

export const webhookSubscriptionsInStorefront = pgTable(
  'webhook_subscriptions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    appId: uuid('app_id').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    event: varchar({ length: 100 }).notNull(),
    targetUrl: text('target_url').notNull(),
    secret: jsonb(),
    maxRetries: integer('max_retries').default(3).notNull(),
    retryCount: integer('retry_count').default(0).notNull(),
    suspendedAt: timestamp('suspended_at', {
      withTimezone: true,
      mode: 'string',
    }),
  },
  (table) => [
    index('idx_webhook_app').using(
      'btree',
      table.appId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_webhook_event').using(
      'btree',
      table.event.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.appId],
      foreignColumns: [appInstallationsInStorefront.id],
      name: 'fk_ws_app',
    }).onDelete('restrict'),
    check('chk_https_only', sql`target_url ~ '^https://'::text`),
    check('chk_retry_limit', sql`retry_count <= max_retries`),
    check(
      'chk_ssrf_protection',
      sql`target_url ~ '^https://(?!localhost|127\\.|10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[0-1]))'::text`
    ),
    check('chk_url_length', sql`length(target_url) <= 2048`),
    check(
      'chk_webhook_secret_s7',
      sql`(secret IS NULL) OR ((jsonb_typeof(secret) = 'object'::text) AND (secret ? 'enc'::text) AND (secret ? 'iv'::text) AND (secret ? 'tag'::text) AND (secret ? 'data'::text))`
    ),
    check('chk_webhook_url_limit', sql`length(target_url) <= 2048`),
    check(
      'webhook_secret_min_length',
      sql`(secret IS NULL) OR (octet_length((secret ->> 'enc'::text)) >= 32)`
    ),
  ]
);

// 🔒 GHOST TABLE MAPPING: outbox_events is RANGE-partitioned by created_at in production.
// Mapped as standard pgTable to prevent drizzle-kit from dropping it.
export const outboxEventsInStorefront = pgTable(
  'outbox_events',
  {
    id: uuid().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    processedAt: timestamp('processed_at', {
      withTimezone: true,
      mode: 'string',
    }),
    retryCount: integer('retry_count').default(0).notNull(),
    status: outboxStatus().default('pending').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    aggregateType: varchar('aggregate_type', { length: 50 }),
    aggregateId: uuid('aggregate_id'),
    payload: jsonb().notNull(),
    traceId: varchar('trace_id', { length: 100 }),
    lockedBy: varchar('locked_by', { length: 100 }),
    lockedAt: timestamp('locked_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('idx_outbox_created_brin').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_outbox_pending').using(
      'btree',
      table.status.asc().nullsLast().op('enum_ops'),
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    check('chk_payload_size', sql`pg_column_size(payload) <= 524288`),
  ]
);

// 🔒 GHOST TABLE MAPPING: payment_logs is RANGE-partitioned by created_at in production.
// Mapped as standard pgTable to prevent drizzle-kit from dropping it.
export const paymentLogsInStorefront = pgTable(
  'payment_logs',
  {
    id: uuid().notNull(),
    orderId: uuid('order_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    provider: varchar({ length: 50 }).notNull(),
    transactionId: varchar('transaction_id', { length: 255 }),
    providerReferenceId: varchar('provider_reference_id', { length: 255 }),
    status: varchar({ length: 20 }).notNull(),
    amount: numeric({ precision: 12, scale: 4 }).notNull(),
    errorCode: varchar('error_code', { length: 100 }),
    errorMessage: text('error_message'),
    rawResponse: jsonb('raw_response'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    ipAddress: inet('ip_address'),
  },
  (table) => [
    index('idx_payment_created_brin').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_payment_logs_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'fk_pl_order',
    }).onDelete('restrict'),
    check(
      'chk_payment_pci_scrub',
      sql`(raw_response IS NULL) OR (NOT (raw_response ?| ARRAY['cvv'::text, 'card_number'::text, 'pan'::text]))`
    ),
  ]
);
