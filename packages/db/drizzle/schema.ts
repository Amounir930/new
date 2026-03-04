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
  pgView,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';
import {
  geography as customGeography,
  int4range,
  ltree,
  moneyAmount,
  pgName,
  tstzrange,
} from './custom_types';

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
export const tenantNiche = pgEnum('tenant_niche', [
  'retail',
  'wellness',
  'education',
  'services',
  'hospitality',
  'real-estate',
  'creative',
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
]);
export const transferStatus = pgEnum('transfer_status', [
  'draft',
  'in_transit',
  'received',
  'cancelled',
]);

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
    nicheType: tenantNiche('niche_type').default('retail').notNull(),
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
    check(
      'chk_risk_score_range',
      sql`(risk_score >= 0) AND (risk_score <= 1000)`
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
    unique('uq_tenant_plan_change_history_composite').on(
      table.id,
      table.tenantId
    ),
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
    priceMonthly: moneyAmount('price_monthly').notNull(),
    // PENDING: failed to parse database type 'money_amount'
    priceYearly: moneyAmount('price_yearly').notNull(),
    defaultMaxProducts: integer('default_max_products').default(50).notNull(),
    defaultMaxOrders: integer('default_max_orders').default(100).notNull(),
    defaultMaxPages: integer('default_max_pages').default(5).notNull(),
    defaultMaxStaff: integer('default_max_staff').default(3).notNull(),
    defaultMaxStorageGb: integer('default_max_storage_gb').default(1).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    code: varchar({ length: 50 }).notNull(),
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
    unique('uq_tenant_tenant_invoices_composite').on(table.id, table.tenantId),
    check(
      'chk_invoice_math',
      sql`COALESCE(total, (0)::numeric) = ((COALESCE(subscription_amount, (0)::numeric) + COALESCE(platform_commission, (0)::numeric)) + COALESCE(app_charges, (0)::numeric))`
    ),
    check('chk_invoice_period', sql`period_end >= period_start`),
  ]
);

export const spatialRefSys = pgTable(
  'spatial_ref_sys',
  {
    srid: integer().primaryKey().notNull(),
    authName: varchar('auth_name', { length: 256 }),
    authSrid: integer('auth_srid'),
    srtext: varchar({ length: 2048 }),
    proj4Text: varchar({ length: 2048 }),
  },
  (_table) => [
    check('spatial_ref_sys_srid_check', sql`(srid > 0) AND (srid <= 998999)`),
  ]
);

export const partConfig = pgTable(
  'part_config',
  {
    parentTable: text('parent_table').primaryKey().notNull(),
    control: text().notNull(),
    partitionType: text('partition_type').notNull(),
    partitionInterval: text('partition_interval').notNull(),
    constraintCols: text('constraint_cols').array(),
    premake: integer().default(4).notNull(),
    optimizeTrigger: integer('optimize_trigger').default(4).notNull(),
    optimizeConstraint: integer('optimize_constraint').default(30).notNull(),
    epoch: text().default('none').notNull(),
    inheritFk: boolean('inherit_fk').default(true).notNull(),
    retention: text(),
    retentionSchema: text('retention_schema'),
    retentionKeepTable: boolean('retention_keep_table').default(true).notNull(),
    retentionKeepIndex: boolean('retention_keep_index').default(true).notNull(),
    infiniteTimePartitions: boolean('infinite_time_partitions')
      .default(false)
      .notNull(),
    datetimeString: text('datetime_string'),
    automaticMaintenance: text('automatic_maintenance').default('on').notNull(),
    jobmon: boolean().default(true).notNull(),
    subPartitionSetFull: boolean('sub_partition_set_full')
      .default(false)
      .notNull(),
    undoInProgress: boolean('undo_in_progress').default(false).notNull(),
    triggerExceptionHandling: boolean('trigger_exception_handling').default(
      false
    ),
    upsert: text().default('').notNull(),
    triggerReturnNull: boolean('trigger_return_null').default(true).notNull(),
    templateTable: text('template_table'),
    publications: text().array(),
    inheritPrivileges: boolean('inherit_privileges').default(false),
    constraintValid: boolean('constraint_valid').default(true).notNull(),
    subscriptionRefresh: text('subscription_refresh'),
    dropCascadeFk: boolean('drop_cascade_fk').default(false).notNull(),
    ignoreDefaultData: boolean('ignore_default_data').default(false).notNull(),
  },
  (table) => [
    index('part_config_type_idx').using(
      'btree',
      table.partitionType.asc().nullsLast().op('text_ops')
    ),
    check('positive_premake_check', sql`premake > 0`),
    check('publications_no_empty_set_chk', sql`publications <> '{}'::text[]`),
    check(
      'control_constraint_col_chk',
      sql`(constraint_cols @> ARRAY[control]) <> true`
    ),
    check('retention_schema_not_empty_chk', sql`retention_schema <> ''::text`),
    check(
      'part_config_automatic_maintenance_check',
      sql`CHECK (check_automatic_maintenance_value(automatic_maintenance`
    ),
    check('part_config_epoch_check', sql`CHECK (check_epoch_type(epoch`),
    check(
      'part_config_type_check',
      sql`CHECK (check_partition_type(partition_type`
    ),
  ]
);

export const partConfigSub = pgTable(
  'part_config_sub',
  {
    subParent: text('sub_parent').primaryKey().notNull(),
    subPartitionType: text('sub_partition_type').notNull(),
    subControl: text('sub_control').notNull(),
    subPartitionInterval: text('sub_partition_interval').notNull(),
    subConstraintCols: text('sub_constraint_cols').array(),
    subPremake: integer('sub_premake').default(4).notNull(),
    subOptimizeTrigger: integer('sub_optimize_trigger').default(4).notNull(),
    subOptimizeConstraint: integer('sub_optimize_constraint')
      .default(30)
      .notNull(),
    subEpoch: text('sub_epoch').default('none').notNull(),
    subInheritFk: boolean('sub_inherit_fk').default(true).notNull(),
    subRetention: text('sub_retention'),
    subRetentionSchema: text('sub_retention_schema'),
    subRetentionKeepTable: boolean('sub_retention_keep_table')
      .default(true)
      .notNull(),
    subRetentionKeepIndex: boolean('sub_retention_keep_index')
      .default(true)
      .notNull(),
    subInfiniteTimePartitions: boolean('sub_infinite_time_partitions')
      .default(false)
      .notNull(),
    subAutomaticMaintenance: text('sub_automatic_maintenance')
      .default('on')
      .notNull(),
    subJobmon: boolean('sub_jobmon').default(true).notNull(),
    subTriggerExceptionHandling: boolean(
      'sub_trigger_exception_handling'
    ).default(false),
    subUpsert: text('sub_upsert').default('').notNull(),
    subTriggerReturnNull: boolean('sub_trigger_return_null')
      .default(true)
      .notNull(),
    subTemplateTable: text('sub_template_table'),
    subInheritPrivileges: boolean('sub_inherit_privileges').default(false),
    subConstraintValid: boolean('sub_constraint_valid').default(true).notNull(),
    subSubscriptionRefresh: text('sub_subscription_refresh'),
    subDateTruncInterval: text('sub_date_trunc_interval'),
    subIgnoreDefaultData: boolean('sub_ignore_default_data')
      .default(false)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.subParent],
      foreignColumns: [partConfig.parentTable],
      name: 'part_config_sub_sub_parent_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    check('positive_premake_check', sql`sub_premake > 0`),
    check(
      'control_constraint_col_chk',
      sql`(sub_constraint_cols @> ARRAY[sub_control]) <> true`
    ),
    check(
      'retention_schema_not_empty_chk',
      sql`sub_retention_schema <> ''::text`
    ),
    check(
      'part_config_sub_automatic_maintenance_check',
      sql`CHECK (check_automatic_maintenance_value(sub_automatic_maintenance`
    ),
    check(
      'part_config_sub_epoch_check',
      sql`CHECK (check_epoch_type(sub_epoch`
    ),
    check(
      'part_config_sub_type_check',
      sql`CHECK (check_partition_type(sub_partition_type`
    ),
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
    unique('uq_tenant_app_usage_records_composite').on(
      table.id,
      table.tenantId
    ),
  ]
);

export const pagesInStorefront = storefront.table(
  '_pages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('uuid_ops'),
        table.slug.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_pages_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_pages_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    check('chk_page_slug', sql`(slug)::text ~ '^[a-z0-9-]+$'::text`),
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
    unique('uq_tenant_dunning_events_composite').on(table.id, table.tenantId),
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
    unique('uq_tenant_feature_gates_composite').on(table.id, table.tenantId),
    unique('uq_feature_tenant_key').on(table.tenantId, table.featureKey),
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
    check(
      'check_email_encrypted',
      sql`(email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text) AND (((email ->> 'enc'::text))::boolean = true))`
    ),
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
    unique('uq_tenant_tenant_quotas_composite').on(table.id, table.tenantId),
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
    unique('uq_tenant_encryption_keys_composite').on(table.id, table.tenantId),
    check(
      'chk_key_material_s7',
      sql`(key_material IS NULL) OR ((jsonb_typeof(key_material) = 'object'::text) AND (key_material ? 'enc'::text) AND (key_material ? 'iv'::text) AND (key_material ? 'tag'::text) AND (key_material ? 'data'::text))`
    ),
  ]
);

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
  (table) => [
    unique('uq_tenant_archival_vault_composite').on(table.id, table.tenantId),
    check('chk_payload_size', sql`pg_column_size(payload) <= 102400`),
  ]
);

export const legalPagesInStorefront = storefront.table(
  'legal_pages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_legal_pages_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_legal_published').using(
      'btree',
      table.isPublished.asc().nullsLast().op('bool_ops')
    ),
    index('idx_legal_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_legal_pages_composite').on(table.id, table.tenantId),
    unique('uq_legal_page_type').on(table.tenantId, table.pageType),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'ck_legal_page_type',
      sql`page_type = ANY (ARRAY['privacy_policy'::text, 'terms_of_service'::text, 'shipping_policy'::text, 'return_policy'::text, 'cookie_policy'::text])`
    ),
    check('ck_legal_version_positive', sql`version > 0`),
  ]
);

export const loyaltyRulesInStorefront = storefront.table(
  'loyalty_rules',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
  (table) => [
    index('idx_loyalty_rules_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_loyalty_rules_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const entityMetafieldsInStorefront = storefront.table(
  'entity_metafields',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_metafields_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_metafields_value_gin').using(
      'gin',
      table.value.asc().nullsLast().op('jsonb_ops')
    ),
    unique('uq_tenant_entity_metafields_composite').on(
      table.id,
      table.tenantId
    ),
    unique('uq_metafield').on(
      table.entityType,
      table.entityId,
      table.namespace,
      table.key
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_metafield_size', sql`pg_column_size(value) <= 10240`),
  ]
);

export const shippingZonesInStorefront = storefront.table(
  'shipping_zones',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_shipping_zones_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_shipping_zones_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_delivery_logic',
      sql`(min_delivery_days >= 0) AND (min_delivery_days <= max_delivery_days)`
    ),
  ]
);

export const searchSynonymsInStorefront = storefront.table(
  'search_synonyms',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    term: varchar({ length: 100 }).notNull(),
    synonyms: jsonb().notNull(),
    languageCode: char('language_code', { length: 2 }).default('ar').notNull(),
    isBidirectional: boolean('is_bidirectional').default(true).notNull(),
  },
  (table) => [
    unique('uq_tenant_search_synonyms_composite').on(table.id, table.tenantId),
    unique('search_synonyms_term_unique').on(table.tenantId, table.term),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_synonym_no_self_loop', sql`NOT (synonyms ? (term)::text)`),
  ]
);

export const reviewsInStorefront = storefront.table(
  'reviews',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    embedding: text(),
    sentimentConfidence: numeric('sentiment_confidence', {
      precision: 3,
      scale: 2,
    }),
  },
  (table) => [
    index('idx_reviews_embedding_cosine').using(
      'btree',
      table.embedding.asc().nullsLast().op('text_ops')
    ),
    index('idx_reviews_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_reviews_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_rating_bounds', sql`(rating >= 1) AND (rating <= 5)`),
    check(
      'chk_sentiment_bounds',
      sql`(sentiment_score >= '-1.00'::numeric) AND (sentiment_score <= 1.00)`
    ),
  ]
);

export const affiliatePartnersInStorefront = storefront.table(
  'affiliate_partners',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_affiliate_partners_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_affiliate').on(table.id, table.tenantId),
    unique('affiliate_partners_referral_code_unique').on(
      table.tenantId,
      table.referralCode
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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
    check(
      'check_email_encrypted',
      sql`(email IS NULL) OR ((jsonb_typeof(email) = 'object'::text) AND (email ? 'enc'::text) AND (email ? 'iv'::text) AND (email ? 'tag'::text) AND (email ? 'data'::text) AND (((email ->> 'enc'::text))::boolean = true))`
    ),
  ]
);

export const categoriesInStorefront = storefront.table(
  '_categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    // PENDING: failed to parse database type 'ltree'
    path: ltree('path'),
  },
  (table) => [
    index('idx_cat_name_trgm').using('gin', sql`(name ->> 'ar'::text)`),
    index('idx_categories_active')
      .using('btree', table.isActive.asc().nullsLast().op('bool_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_categories_parent').using(
      'btree',
      table.parentId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_categories_path_gist').using(
      'gist',
      table.path.asc().nullsLast().op('gist_ltree_ops')
    ),
    uniqueIndex('idx_categories_slug_active')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('uuid_ops'),
        table.slug.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_categories_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.parentId, table.tenantId],
      foreignColumns: [table.id, table.tenantId],
      name: 'fk_cat_parent',
    }).onDelete('restrict'),
    unique('uq_tenant_cat').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
      withCheck: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
    }),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_categories_no_circular_ref',
      sql`(parent_id IS NULL) OR (parent_id <> id)`
    ),
  ]
);

export const abandonedCheckoutsInStorefront = storefront.table(
  'abandoned_checkouts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_abandoned_checkouts_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_abandoned_created').using(
      'btree',
      table.createdAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_abandoned_items_gin').using(
      'gin',
      table.items.asc().nullsLast().op('jsonb_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.customerId],
      foreignColumns: [
        customersInStorefront.id,
        customersInStorefront.tenantId,
      ],
      name: 'fk_ac_customer',
    }).onDelete('restrict'),
    unique('uq_tenant_abandoned_checkouts_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const affiliateTransactionsInStorefront = storefront.table(
  'affiliate_transactions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_affiliate_transactions_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.partnerId],
      foreignColumns: [
        affiliatePartnersInStorefront.id,
        affiliatePartnersInStorefront.tenantId,
      ],
      name: 'fk_afftx_partner',
    }).onDelete('restrict'),
    unique('uq_tenant_affiliate_transactions_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_aff_comm_positive',
      sql`COALESCE(commission_amount, (0)::numeric) > (0)::numeric`
    ),
  ]
);

export const b2BCompaniesInStorefront = storefront.table(
  'b2b_companies',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
  (table) => [
    index('idx_b2b_companies_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_b2b_companies_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const b2BPricingTiersInStorefront = storefront.table(
  'b2b_pricing_tiers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    // PENDING: failed to parse database type 'int4range'
    quantityRange: int4range('quantity_range').notNull(),
    lockVersion: integer('lock_version').default(1).notNull(),
  },
  (table) => [
    index('idx_b2b_pricing').using(
      'btree',
      table.companyId.asc().nullsLast().op('uuid_ops'),
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_b2bp_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [b2BCompaniesInStorefront.id],
      name: 'fk_b2bpt_company',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.productId, table.tenantId],
      foreignColumns: [productsInStorefront.id, productsInStorefront.tenantId],
      name: 'fk_b2bpt_product',
    }).onDelete('restrict'),
    unique('uq_tenant_b2b_pricing_tiers_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const b2BUsersInStorefront = storefront.table(
  'b2b_users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_b2b_users_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.companyId],
      foreignColumns: [b2BCompaniesInStorefront.id],
      name: 'fk_b2bu_company',
    }).onDelete('restrict'),
    unique('uq_tenant_b2b_users_composite').on(table.id, table.tenantId),
    unique('uq_b2b_company_customer').on(
      table.tenantId,
      table.companyId,
      table.customerId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_b2b_unit_price_pos',
      sql`COALESCE(unit_price, (0)::numeric) >= (0)::numeric`
    ),
  ]
);

export const productsInStorefront = storefront.table(
  '_products',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_products_embedding').using(
      'hnsw',
      table.embedding.asc().nullsLast().op('vector_cosine_ops')
    ),
    index('idx_products_embedding_cosine')
      .using('hnsw', table.embedding.asc().nullsLast().op('vector_cosine_ops'))
      .with({ m: '24', ef_construction: '128' }),
    index('idx_products_featured')
      .using('btree', table.isFeatured.asc().nullsLast().op('bool_ops'))
      .where(sql`(deleted_at IS NULL)`),
    index('idx_products_name').using(
      'gin',
      table.name.asc().nullsLast().op('jsonb_ops')
    ),
    uniqueIndex('idx_products_sku_active')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('text_ops'),
        table.sku.asc().nullsLast().op('text_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    uniqueIndex('idx_products_slug_active')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('text_ops'),
        table.slug.asc().nullsLast().op('text_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_products_tags').using(
      'gin',
      table.tags.asc().nullsLast().op('array_ops')
    ),
    index('idx_products_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
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
    unique('uq_tenant_product').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    check(
      'chk_barcode_format',
      sql`(barcode IS NULL) OR ((barcode)::text ~ '^[A-Z0-9-]{8,50} $'::text)`
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

export const brandsInStorefront = storefront.table(
  '_brands',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_brand_name_trgm').using('gin', sql`(name ->> 'ar'::text)`),
    index('idx_brands_active')
      .using('btree', table.isActive.asc().nullsLast().op('bool_ops'))
      .where(sql`(deleted_at IS NULL)`),
    uniqueIndex('idx_brands_slug_active')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('text_ops'),
        table.slug.asc().nullsLast().op('text_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_brands_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_brands_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
      withCheck: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
    }),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const cartsInStorefront = storefront.table(
  'carts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_carts_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.customerId, table.tenantId],
      foreignColumns: [
        customersInStorefront.id,
        customersInStorefront.tenantId,
      ],
      name: 'fk_cart_customer',
    }).onDelete('restrict'),
    unique('uq_tenant_cart').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_cart_items_size', sql`pg_column_size(items) <= 51200`),
    check(
      'chk_cart_subtotal_pos',
      sql`(subtotal IS NULL) OR (COALESCE(subtotal, (0)::numeric) >= (0)::numeric)`
    ),
  ]
);

export const customerAddressesInStorefront = storefront.table(
  'customer_addresses',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    // PENDING: failed to parse database type 'geography'
    coordinates: customGeography('coordinates'),
  },
  (table) => [
    index('idx_customer_addresses_customer').using(
      'btree',
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_customer_addresses_location_gist').using(
      'gist',
      table.coordinates.asc().nullsLast().op('gist_geography_ops')
    ),
    index('idx_customer_addresses_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('uq_cust_default_addr')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('uuid_ops'),
        table.customerId.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(is_default = true)`),
    foreignKey({
      columns: [table.tenantId, table.customerId],
      foreignColumns: [
        customersInStorefront.id,
        customersInStorefront.tenantId,
      ],
      name: 'fk_addr_cust',
    }).onDelete('restrict'),
    unique('uq_tenant_customer_addresses_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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
    check(
      'check_line1_encrypted',
      sql`(line1 IS NULL) OR ((jsonb_typeof(line1) = 'object'::text) AND (line1 ? 'enc'::text) AND (line1 ? 'iv'::text) AND (line1 ? 'tag'::text) AND (line1 ? 'data'::text) AND (((line1 ->> 'enc'::text))::boolean = true))`
    ),
    check(
      'check_postal_code_encrypted',
      sql`(postal_code IS NULL) OR ((jsonb_typeof(postal_code) = 'object'::text) AND (postal_code ? 'enc'::text) AND (postal_code ? 'iv'::text) AND (postal_code ? 'tag'::text) AND (postal_code ? 'data'::text) AND (((postal_code ->> 'enc'::text))::boolean = true))`
    ),
    check(
      'check_phone_encrypted',
      sql`(phone IS NULL) OR ((jsonb_typeof(phone) = 'object'::text) AND (phone ? 'enc'::text) AND (phone ? 'iv'::text) AND (phone ? 'tag'::text) AND (phone ? 'data'::text) AND (((phone ->> 'enc'::text))::boolean = true))`
    ),
  ]
);

export const cartItemsInStorefront = storefront.table(
  'cart_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_cart_items_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.cartId],
      foreignColumns: [cartsInStorefront.id, cartsInStorefront.tenantId],
      name: 'fk_ci_cart',
    }).onDelete('cascade'),
    unique('uq_tenant_cart_items_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_cart_item_price',
      sql`COALESCE(price, (0)::numeric) >= (0)::numeric`
    ),
  ]
);

export const priceRulesInStorefront = storefront.table(
  'price_rules',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_price_rules_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_price_rule').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_entitled_array',
      sql`(entitled_ids IS NULL) OR (jsonb_typeof(entitled_ids) = 'array'::text)`
    ),
    check(
      'chk_entitled_len',
      sql`(entitled_ids IS NULL) OR (jsonb_array_length(entitled_ids) <= 5000)`
    ),
    check('chk_pr_dates', sql`(ends_at IS NULL) OR (ends_at > starts_at)`),
    check('chk_rule_dates', sql`(ends_at IS NULL) OR (ends_at > starts_at)`),
  ]
);

export const customerConsentsInStorefront = storefront.table(
  'customer_consents',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_customer_consents_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.customerId, table.tenantId],
      foreignColumns: [
        customersInStorefront.id,
        customersInStorefront.tenantId,
      ],
      name: 'fk_consent_cust',
    }).onDelete('restrict'),
    unique('uq_tenant_customer_consents_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const discountCodesInStorefront = storefront.table(
  'discount_codes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_discount_codes_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.priceRuleId],
      foreignColumns: [
        priceRulesInStorefront.id,
        priceRulesInStorefront.tenantId,
      ],
      name: 'fk_dc_price_rule',
    }).onDelete('restrict'),
    unique('uq_tenant_discount_codes_composite').on(table.id, table.tenantId),
    unique('discount_codes_code_unique').on(table.tenantId, table.code),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_code_strict',
      sql`((code)::text = upper((code)::text)) AND ((code)::text ~ '^[A-Z0-9_-]+$'::text)`
    ),
  ]
);

export const faqCategoriesInStorefront = storefront.table(
  'faq_categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    name: varchar({ length: 100 }).notNull(),
    order: integer().default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_faq_categories_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_faq_categories_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const faqsInStorefront = storefront.table(
  'faqs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_faqs_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [faqCategoriesInStorefront.id],
      name: 'fk_faq_category',
    }).onDelete('set null'),
    unique('uq_tenant_faqs_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const ordersInStorefront = storefront.table(
  '_orders',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
        table.createdAt.asc().nullsLast().op('enum_ops')
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
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('text_ops'),
        table.idempotencyKey.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(idempotency_key IS NOT NULL)`),
    uniqueIndex('idx_orders_number_active')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('text_ops'),
        table.orderNumber.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_orders_payment_ref')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('text_ops'),
        table.paymentGatewayReference.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(payment_gateway_reference IS NOT NULL)`),
    index('idx_orders_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.customerId],
      foreignColumns: [
        customersInStorefront.id,
        customersInStorefront.tenantId,
      ],
      name: 'fk_ord_customer',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customersInStorefront.id],
      name: 'orders_customer_id_fkey',
    }).onDelete('restrict'),
    unique('uq_tenant_order').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
      withCheck: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
    }),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_checkout_math',
      sql`COALESCE(total, (0)::numeric) = ((((COALESCE(subtotal, (0)::numeric) + COALESCE(tax, (0)::numeric)) + COALESCE(shipping, (0)::numeric)) - COALESCE(discount, (0)::numeric)) - COALESCE(coupon_discount, (0)::numeric))`
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

export const flashSalesInStorefront = storefront.table(
  'flash_sales',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_flash_sales_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_flash_sale').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_flash_time', sql`end_time > starts_at`),
  ]
);

export const flashSaleProductsInStorefront = storefront.table(
  'flash_sale_products',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    flashSaleId: uuid('flash_sale_id'),
    productId: uuid('product_id'),
    discountBasisPoints: integer('discount_basis_points').notNull(),
    quantityLimit: integer('quantity_limit').notNull(),
    soldQuantity: integer('sold_quantity').default(0).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    // PENDING: failed to parse database type 'tstzrange'
    validDuring: tstzrange('valid_during'),
  },
  (table) => [
    index('idx_flash_sale_products_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
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
      columns: [table.flashSaleId, table.tenantId],
      foreignColumns: [
        flashSalesInStorefront.id,
        flashSalesInStorefront.tenantId,
      ],
      name: 'fk_fsp_flash_sale',
    }).onDelete('restrict'),
    unique('uq_tenant_flash_sale_products_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_flash_limit', sql`sold_quantity <= quantity_limit`),
  ]
);

export const fulfillmentsInStorefront = storefront.table(
  'fulfillments',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_fulfillments_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderId, table.tenantId],
      foreignColumns: [ordersInStorefront.id, ordersInStorefront.tenantId],
      name: 'fk_ful_order',
    }).onDelete('restrict'),
    unique('uq_tenant_fulfillments_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const inventoryLevelsInStorefront = storefront.table(
  'inventory_levels',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_inventory_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.locationId, table.tenantId],
      foreignColumns: [
        locationsInStorefront.id,
        locationsInStorefront.tenantId,
      ],
      name: 'fk_inv_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId, table.tenantId],
      foreignColumns: [
        productVariantsInStorefront.id,
        productVariantsInStorefront.tenantId,
      ],
      name: 'fk_inv_variant',
    }).onDelete('restrict'),
    unique('uq_tenant_inventory_levels_composite').on(table.id, table.tenantId),
    unique('uq_inventory_loc_var').on(table.locationId, table.variantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_incoming_positive', sql`incoming >= 0`),
    check('chk_reserved_logic', sql`reserved <= available`),
    check('chk_available', sql`available >= 0`),
    check('chk_reserved', sql`reserved >= 0`),
  ]
);

export const orderItemsInStorefront = storefront.table(
  'order_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
      table.tenantId.asc().nullsLast().op('uuid_ops'),
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_order_items_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_order_items_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderId, table.tenantId],
      foreignColumns: [ordersInStorefront.id, ordersInStorefront.tenantId],
      name: 'fk_oi_order',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId, table.tenantId],
      foreignColumns: [
        productVariantsInStorefront.id,
        productVariantsInStorefront.tenantId,
      ],
      name: 'fk_oi_variant',
    }).onDelete('restrict'),
    unique('uq_tenant_order_items_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_returned_qty', sql`returned_quantity <= fulfilled_quantity`),
    check('qty_positive', sql`quantity > 0`),
    check(
      'chk_item_inner_not_null',
      sql`(price IS NOT NULL) AND (total IS NOT NULL)`
    ),
    check(
      'chk_item_math',
      sql`COALESCE(total, (0)::numeric) = (((COALESCE(price, (0)::numeric) * (quantity)::numeric) - COALESCE(discount_amount, (0)::numeric)) + COALESCE(tax_amount, (0)::numeric))`
    ),
    check('chk_fulfill_qty', sql`fulfilled_quantity <= quantity`),
    check(
      'chk_item_discount_logic',
      sql`COALESCE(discount_amount, (0)::numeric) <= (COALESCE(price, (0)::numeric) * (quantity)::numeric)`
    ),
  ]
);

export const fulfillmentItemsInStorefront = storefront.table(
  'fulfillment_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    fulfillmentId: uuid('fulfillment_id').notNull(),
    orderItemId: uuid('order_item_id').notNull(),
    quantity: integer().notNull(),
  },
  (table) => [
    index('idx_fulfill_items').using(
      'btree',
      table.fulfillmentId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_fulfillment_items_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
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
    unique('uq_tenant_fulfillment_items_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const inventoryReservationsInStorefront = storefront.table(
  'inventory_reservations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_inv_res_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.locationId, table.tenantId],
      foreignColumns: [
        locationsInStorefront.id,
        locationsInStorefront.tenantId,
      ],
      name: 'fk_ir_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId, table.tenantId],
      foreignColumns: [
        productVariantsInStorefront.id,
        productVariantsInStorefront.tenantId,
      ],
      name: 'fk_ir_variant',
    }).onDelete('restrict'),
    unique('uq_tenant_inventory_reservations_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_res_qty_limit', sql`quantity <= 100`),
    check(
      'chk_res_time_bound',
      sql`expires_at <= (created_at + '7 days'::interval)`
    ),
  ]
);

export const inventoryMovementsInStorefront = storefront.table(
  'inventory_movements',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_inv_mov_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_inv_mov_variant').using(
      'btree',
      table.variantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.locationId, table.tenantId],
      foreignColumns: [
        locationsInStorefront.id,
        locationsInStorefront.tenantId,
      ],
      name: 'fk_im_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.variantId, table.tenantId],
      foreignColumns: [
        productVariantsInStorefront.id,
        productVariantsInStorefront.tenantId,
      ],
      name: 'fk_im_variant',
    }).onDelete('restrict'),
    unique('uq_tenant_inventory_movements_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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
    check('qty_nonzero', sql`quantity <> 0`),
  ]
);

export const inventoryTransfersInStorefront = storefront.table(
  'inventory_transfers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_inv_tra_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.fromLocationId, table.tenantId],
      foreignColumns: [
        locationsInStorefront.id,
        locationsInStorefront.tenantId,
      ],
      name: 'fk_it_from_loc',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.toLocationId, table.tenantId],
      foreignColumns: [
        locationsInStorefront.id,
        locationsInStorefront.tenantId,
      ],
      name: 'fk_it_to_loc',
    }).onDelete('restrict'),
    unique('uq_tenant_inventory_transfers_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_transfer_future',
      sql`(expected_arrival IS NULL) OR (expected_arrival >= created_at)`
    ),
    check('chk_transfer_locations', sql`from_location_id <> to_location_id`),
  ]
);

export const kbArticlesInStorefront = storefront.table(
  'kb_articles',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_kb_articles_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [kbCategoriesInStorefront.id],
      name: 'fk_kba_category',
    }).onDelete('restrict'),
    unique('uq_tenant_kb_articles_composite').on(table.id, table.tenantId),
    unique('kb_articles_slug_unique').on(table.tenantId, table.slug),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const orderEditsInStorefront = storefront.table(
  'order_edits',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_order_edits_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.lineItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_oe_line_item',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.tenantId, table.orderId],
      foreignColumns: [ordersInStorefront.id, ordersInStorefront.tenantId],
      name: 'fk_oe_order',
    }).onDelete('restrict'),
    unique('uq_tenant_order_edits_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const orderTimelineInStorefront = storefront.table(
  'order_timeline',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_order_timeline_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_timeline_created').using(
      'brin',
      table.createdAt.asc().nullsLast().op('timestamptz_minmax_ops')
    ),
    index('idx_timeline_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.orderId],
      foreignColumns: [ordersInStorefront.id, ordersInStorefront.tenantId],
      name: 'fk_ot_order',
    }).onDelete('restrict'),
    unique('uq_tenant_order_timeline_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const marketsInStorefront = storefront.table(
  'markets',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_markets_tenant_active').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('uq_tenant_primary_market')
      .using('btree', table.tenantId.asc().nullsLast().op('uuid_ops'))
      .where(sql`(is_primary = true)`),
    unique('uq_tenant_markets_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const priceListsInStorefront = storefront.table(
  'price_lists',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    marketId: uuid('market_id').notNull(),
    productId: uuid('product_id'),
    variantId: uuid('variant_id'),
    // PENDING: failed to parse database type 'int4range'
    quantityRange: int4range('quantity_range').notNull(),
    price: numeric({ precision: 12, scale: 4 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 4 }),
  },
  (table) => [
    index('idx_price_lists_tenant_active').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.marketId],
      foreignColumns: [marketsInStorefront.id, marketsInStorefront.tenantId],
      name: 'fk_pl_market',
    }).onDelete('restrict'),
    unique('uq_tenant_price_lists_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const productAttributesInStorefront = storefront.table(
  'product_attributes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_attrs_value_trgm').using(
      'gin',
      table.attributeValue.asc().nullsLast().op('gin_trgm_ops')
    ),
    index('idx_product_attributes_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.productId],
      foreignColumns: [productsInStorefront.id, productsInStorefront.tenantId],
      name: 'fk_attr_prod',
    }).onDelete('cascade'),
    unique('uq_tenant_product_attributes_composite').on(
      table.id,
      table.tenantId
    ),
    unique('uq_tenant_product_attr').on(
      table.tenantId,
      table.productId,
      table.attributeName
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_attr_val_len', sql`length(attribute_value) <= 1024`),
  ]
);

export const productBundlesInStorefront = storefront.table(
  'product_bundles',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
  (table) => [
    index('idx_product_bundles_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_bundle').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_bundle_discount_positive',
      sql`COALESCE(discount_value, (0)::numeric) >= (0)::numeric`
    ),
  ]
);

export const productBundleItemsInStorefront = storefront.table(
  'product_bundle_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    bundleId: uuid('bundle_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer().default(1).notNull(),
  },
  (table) => [
    index('idx_bundle_items').using(
      'btree',
      table.bundleId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_product_bundle_items_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.bundleId],
      foreignColumns: [
        productBundlesInStorefront.id,
        productBundlesInStorefront.tenantId,
      ],
      name: 'fk_pbi_bundle',
    }).onDelete('restrict'),
    unique('uq_tenant_product_bundle_items_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const productImagesInStorefront = storefront.table(
  'product_images',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_product_images_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('uq_primary_image')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('uuid_ops'),
        table.productId.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(is_primary = true)`),
    foreignKey({
      columns: [table.tenantId, table.productId],
      foreignColumns: [productsInStorefront.id, productsInStorefront.tenantId],
      name: 'fk_img_prod',
    }).onDelete('cascade'),
    unique('uq_tenant_product_images_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const purchaseOrdersInStorefront = storefront.table(
  'purchase_orders',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_purchase_orders_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.locationId],
      foreignColumns: [
        locationsInStorefront.id,
        locationsInStorefront.tenantId,
      ],
      name: 'fk_po_location',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.supplierId],
      foreignColumns: [suppliersInStorefront.id],
      name: 'fk_po_supplier',
    }).onDelete('restrict'),
    unique('uq_tenant_purchase_orders_composite').on(table.id, table.tenantId),
    unique('idx_po_number_unique').on(table.tenantId, table.orderNumber),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const suppliersInStorefront = storefront.table(
  'suppliers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
  (table) => [
    index('idx_suppliers_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_suppliers_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const purchaseOrderItemsInStorefront = storefront.table(
  'purchase_order_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_poi_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.poId],
      foreignColumns: [purchaseOrdersInStorefront.id],
      name: 'fk_poi_po',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.tenantId, table.variantId],
      foreignColumns: [
        productVariantsInStorefront.id,
        productVariantsInStorefront.tenantId,
      ],
      name: 'fk_poi_variant',
    }).onDelete('restrict'),
    unique('uq_tenant_purchase_order_items_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_po_receive', sql`quantity_received <= quantity_ordered`),
    check('qty_positive', sql`quantity_ordered > 0`),
  ]
);

export const refundsInStorefront = storefront.table(
  'refunds',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_refunds_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.orderId],
      foreignColumns: [ordersInStorefront.id, ordersInStorefront.tenantId],
      name: 'fk_ref_order',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersInStorefront.id],
      name: 'refunds_order_id_fkey',
    }).onDelete('restrict'),
    unique('uq_tenant_refund').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_refund_positive',
      sql`COALESCE(amount, (0)::numeric) > (0)::numeric`
    ),
  ]
);

export const refundItemsInStorefront = storefront.table(
  'refund_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_refund_items_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_ri_order_item',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.tenantId, table.refundId],
      foreignColumns: [refundsInStorefront.id, refundsInStorefront.tenantId],
      name: 'fk_ri_refund',
    }).onDelete('restrict'),
    unique('uq_tenant_refund_items_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_refund_item_amt',
      sql`(COALESCE(amount, (0)::numeric) > (0)::numeric) AND (quantity > 0)`
    ),
  ]
);

export const rmaRequestsInStorefront = storefront.table(
  'rma_requests',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_rma_requests_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_rma_status').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.orderId],
      foreignColumns: [ordersInStorefront.id, ordersInStorefront.tenantId],
      name: 'fk_rma_order',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.orderItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_rma_order_item',
    }).onDelete('restrict'),
    unique('uq_tenant_rma').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const rmaItemsInStorefront = storefront.table(
  'rma_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_rma_items_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.orderItemId],
      foreignColumns: [orderItemsInStorefront.id],
      name: 'fk_rmai_order_item',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.tenantId, table.rmaId],
      foreignColumns: [
        rmaRequestsInStorefront.id,
        rmaRequestsInStorefront.tenantId,
      ],
      name: 'fk_rmai_rma',
    }).onDelete('restrict'),
    unique('uq_tenant_rma_items_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('qty_positive', sql`quantity > 0`),
  ]
);

export const staffRolesInStorefront = storefront.table(
  'staff_roles',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isSystem: boolean('is_system').default(false).notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    permissions: jsonb().notNull(),
  },
  (table) => [
    index('idx_staff_roles_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_staff_roles_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const staffMembersInStorefront = storefront.table(
  'staff_members',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_staff_members_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_staff_user').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [staffRolesInStorefront.id],
      name: 'fk_sm_role',
    }).onDelete('restrict'),
    unique('uq_tenant_staff').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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
    check(
      'chk_owner_email_s7',
      sql`(owner_email IS NULL) OR ((jsonb_typeof(owner_email) = 'object'::text) AND (owner_email ? 'enc'::text) AND (owner_email ? 'iv'::text) AND (owner_email ? 'tag'::text) AND (owner_email ? 'data'::text))`
    ),
    check('chk_ui_config_size', sql`pg_column_size(ui_config) <= 204800`),
    check(
      'subdomain_safety_check',
      sql`(subdomain ~* '^[a-z0-9](-?[a-z0-9])*$'::text) AND (subdomain <> ALL (ARRAY['admin'::text, 'api'::text, 'app'::text, 'dev'::text, 'test'::text, 'www'::text, 'portal'::text, 'apex'::text])) AND ((length(subdomain) >= 3) AND (length(subdomain) <= 63))`
    ),
    check(
      'check_owner_email_encrypted',
      sql`(owner_email IS NULL) OR ((jsonb_typeof(owner_email) = 'object'::text) AND (owner_email ? 'enc'::text) AND (owner_email ? 'iv'::text) AND (owner_email ? 'tag'::text) AND (owner_email ? 'data'::text) AND (((owner_email ->> 'enc'::text))::boolean = true))`
    ),
  ]
);

export const staffSessionsInStorefront = storefront.table(
  'staff_sessions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
      table.deviceFingerprint.asc().nullsLast().op('uuid_ops'),
      table.revokedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_session_token').using(
      'hash',
      table.tokenHash.asc().nullsLast().op('bpchar_ops')
    ),
    index('idx_sessions_token_hash').using(
      'hash',
      table.tokenHash.asc().nullsLast().op('bpchar_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.staffId],
      foreignColumns: [
        staffMembersInStorefront.id,
        staffMembersInStorefront.tenantId,
      ],
      name: 'fk_ss_staff',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenantsInGovernance.id],
      name: 'fk_ss_tenant',
    }).onDelete('restrict'),
    unique('uq_tenant_staff_sessions_composite').on(table.id, table.tenantId),
    unique('staff_sessions_token_hash_unique').on(table.tokenHash),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const taxCategoriesInStorefront = storefront.table(
  'tax_categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    priority: integer().default(0).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    name: varchar({ length: 100 }).notNull(),
    code: varchar({ length: 50 }),
    description: text(),
  },
  (table) => [
    index('idx_tax_categories_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_tax_category').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const taxRulesInStorefront = storefront.table(
  'tax_rules',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_tax_rules_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.taxCategoryId],
      foreignColumns: [
        taxCategoriesInStorefront.id,
        taxCategoriesInStorefront.tenantId,
      ],
      name: 'fk_tr_tax_category',
    }).onDelete('restrict'),
    unique('uq_tenant_tax_rules_composite').on(table.id, table.tenantId),
    unique('uq_tax_rule').on(
      table.tenantId,
      table.country,
      table.state,
      table.zipCode,
      table.taxType
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_tax_rate_bounds', sql`(rate >= 0) AND (rate <= 10000)`),
    check(
      'chk_tax_rounding',
      sql`(rounding_rule)::text = ANY (ARRAY[('half_even'::character varying)::text, ('half_up'::character varying)::text, ('half_down'::character varying)::text])`
    ),
  ]
);

export const appInstallationsInStorefront = storefront.table(
  'app_installations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
  (table) => [
    index('idx_app_installations_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_app').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const webhookSubscriptionsInStorefront = storefront.table(
  'webhook_subscriptions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_webhook_subscriptions_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.appId],
      foreignColumns: [table.id, table.tenantId],
      name: 'fk_ws_app',
    }).onDelete('restrict'),
    unique('uq_tenant_webhook_subscriptions_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_https_only', sql`target_url ~ '^https://'::text`),
    check('chk_retry_limit', sql`retry_count <= max_retries`),
    check('chk_url_length', sql`length(target_url) <= 2048`),
    check(
      'chk_webhook_secret_s7',
      sql`(secret IS NULL) OR ((jsonb_typeof(secret) = 'object'::text) AND (secret ? 'enc'::text) AND (secret ? 'iv'::text) AND (secret ? 'tag'::text) AND (secret ? 'data'::text))`
    ),
    check(
      'webhook_secret_min_length',
      sql`(secret IS NULL) OR (octet_length((secret ->> 'enc'::text)) >= 32)`
    ),
  ]
);

export const announcementBarsInStorefront = storefront.table(
  'announcement_bars',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    bgColor: varchar('bg_color', { length: 20 }).default('#000000').notNull(),
    textColor: varchar('text_color', { length: 20 })
      .default('#ffffff')
      .notNull(),
    content: jsonb().notNull(),
    linkUrl: text('link_url'),
  },
  (table) => [
    index('idx_announcements_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_announcement_bars_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const walletTransactionsInStorefront = storefront.table(
  'wallet_transactions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_wallet_transactions_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('wallet_tx_idempotency')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('text_ops'),
        table.idempotencyKey.asc().nullsLast().op('text_ops')
      )
      .where(sql`(idempotency_key IS NOT NULL)`),
    unique('uq_tenant_wallet_transactions_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const smartCollectionsInStorefront = storefront.table(
  'smart_collections',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_smart_collections_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_smart_collections_composite').on(
      table.id,
      table.tenantId
    ),
    unique('idx_smart_collections_slug').on(table.tenantId, table.slug),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check(
      'chk_conditions_array',
      sql`jsonb_typeof(conditions) = 'array'::text`
    ),
    check('conditions_size', sql`pg_column_size(conditions) <= 10240`),
  ]
);

export const bannersInStorefront = storefront.table(
  'banners',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
      table.isActive.asc().nullsLast().op('bool_ops'),
      table.location.asc().nullsLast().op('text_ops')
    ),
    index('idx_banners_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_banners_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const blogPostsInStorefront = storefront.table(
  'blog_posts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    category: varchar({ length: 100 }),
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
    index('idx_blog_posts_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_blog_published').using(
      'btree',
      table.isPublished.asc().nullsLast().op('bool_ops')
    ),
    index('idx_blog_published_at').using(
      'btree',
      table.publishedAt.asc().nullsLast().op('timestamptz_ops')
    ),
    uniqueIndex('idx_blog_slug_active')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('uuid_ops'),
        table.slug.asc().nullsLast().op('text_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_blog_tags').using(
      'gin',
      table.tags.asc().nullsLast().op('array_ops')
    ),
    unique('uq_tenant_blog_posts_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const productViewsInStorefront = storefront.table(
  'product_views',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_product_views_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_pv_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_pv_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_product_views_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const couponsInStorefront = storefront.table(
  'coupons',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    index('idx_coupons_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_coupon_id').on(table.id, table.tenantId),
    unique('coupons_code_unique').on(table.tenantId, table.code),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const couponUsagesInStorefront = storefront.table(
  'coupon_usages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    couponId: uuid('coupon_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    orderId: uuid('order_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_coupon_usage_lookup').using(
      'btree',
      table.customerId.asc().nullsLast().op('uuid_ops'),
      table.couponId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_coupon_usages_lookup').using(
      'btree',
      table.couponId.asc().nullsLast().op('uuid_ops'),
      table.customerId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_coupon_usages_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.couponId],
      foreignColumns: [couponsInStorefront.id, couponsInStorefront.tenantId],
      name: 'fk_cu_coupon',
    }).onDelete('restrict'),
    unique('uq_tenant_coupon_usages_composite').on(table.id, table.tenantId),
    unique('uq_coupon_cust_order').on(
      table.tenantId,
      table.couponId,
      table.customerId,
      table.orderId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const productVariantsInStorefront = storefront.table(
  'product_variants',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('uuid_ops'),
        table.sku.asc().nullsLast().op('uuid_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    index('idx_variants_embedding_cosine')
      .using('hnsw', table.embedding.asc().nullsLast().op('vector_cosine_ops'))
      .with({ m: '24', ef_construction: '128' }),
    index('idx_variants_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_variants_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.tenantId, table.productId],
      foreignColumns: [productsInStorefront.id, productsInStorefront.tenantId],
      name: 'fk_var_prod',
    }).onDelete('restrict'),
    unique('uq_tenant_variant').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const locationsInStorefront = storefront.table(
  'locations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
    // PENDING: failed to parse database type 'geography'
    coordinates: customGeography('coordinates'),
  },
  (table) => [
    index('idx_locations_coordinates_gist').using(
      'gist',
      table.coordinates.asc().nullsLast().op('gist_geography_ops')
    ),
    index('idx_locations_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_loc').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const inventoryTransferItemsInStorefront = storefront.table(
  'inventory_transfer_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    transferId: uuid('transfer_id').notNull(),
    variantId: uuid('variant_id').notNull(),
    quantity: integer().notNull(),
  },
  (table) => [
    index('idx_inv_tra_items_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
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
      columns: [table.variantId, table.tenantId],
      foreignColumns: [
        productVariantsInStorefront.id,
        productVariantsInStorefront.tenantId,
      ],
      name: 'fk_iti_variant',
    }).onDelete('restrict'),
    unique('uq_tenant_inventory_transfer_items_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const kbCategoriesInStorefront = storefront.table(
  'kb_categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    icon: varchar({ length: 50 }),
    order: integer().default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_kb_categories_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_kb_categories_composite').on(table.id, table.tenantId),
    unique('kb_categories_slug_unique').on(table.tenantId, table.slug),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const currencyRatesInStorefront = storefront.table(
  'currency_rates',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    fromCurrency: char('from_currency', { length: 3 }).notNull(),
    toCurrency: char('to_currency', { length: 3 }).notNull(),
    rate: numeric({ precision: 12, scale: 6 }).notNull(),
  },
  (table) => [
    index('idx_currency_rates_tenant_active').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_currency_rates_composite').on(table.id, table.tenantId),
    unique('uq_tenant_currency_pair').on(
      table.tenantId,
      table.fromCurrency,
      table.toCurrency
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const popupsInStorefront = storefront.table(
  'popups',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    triggerType: varchar('trigger_type', { length: 20 })
      .default('time_on_page')
      .notNull(),
    content: jsonb().notNull(),
    settings: jsonb().notNull(),
  },
  (table) => [
    index('idx_popups_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_popups_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const customerSegmentsInStorefront = storefront.table(
  'customer_segments',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    customerCount: integer('customer_count').default(0).notNull(),
    autoUpdate: boolean('auto_update').default(true).notNull(),
    matchType: varchar('match_type', { length: 5 }).default('all').notNull(),
    name: jsonb().notNull(),
    conditions: jsonb().notNull(),
  },
  (table) => [
    index('idx_customer_segments_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_customer_segments_composite').on(
      table.id,
      table.tenantId
    ),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const shippingMethodsInStorefront = storefront.table(
  'shipping_methods',
  {
    id: uuid().default(sql`gen_ulid()`).primaryKey().notNull(),
    zoneId: uuid('zone_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    name: text().notNull(),
    provider: text(),
    // PENDING: failed to parse database type 'money_amount'
    basePrice: moneyAmount('base_price').notNull(),
    // PENDING: failed to parse database type 'money_amount'
    minOrderTotal: moneyAmount('min_order_total'),
    minWeightGrams: integer('min_weight_grams'),
    maxWeightGrams: integer('max_weight_grams'),
    estimatedDays: text('estimated_days'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.zoneId],
      foreignColumns: [shippingZonesInStorefront.id],
      name: 'shipping_methods_zone_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const shippingRatesInStorefront = storefront.table(
  'shipping_rates',
  {
    id: uuid().default(sql`gen_ulid()`).primaryKey().notNull(),
    methodId: uuid('method_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    // PENDING: failed to parse database type 'money_amount'
    price: moneyAmount('price').notNull(),
    minWeight: integer('min_weight').notNull(),
    maxWeight: integer('max_weight').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.methodId],
      foreignColumns: [shippingMethodsInStorefront.id],
      name: 'shipping_rates_method_id_fkey',
    }).onDelete('restrict'),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const customersInStorefront = storefront.table(
  '_customers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
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
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('bpchar_ops'),
        table.emailHash.asc().nullsLast().op('bpchar_ops')
      )
      .where(sql`(deleted_at IS NULL)`),
    uniqueIndex('idx_customer_phone_hash')
      .using(
        'btree',
        table.tenantId.asc().nullsLast().op('bpchar_ops'),
        table.phoneHash.asc().nullsLast().op('bpchar_ops')
      )
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
    index('idx_customers_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_customer').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
      withCheck: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)`,
    }),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
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

export const customTimePartitions = pgTable(
  'custom_time_partitions',
  {
    parentTable: text('parent_table').notNull(),
    childTable: text('child_table').notNull(),
    // PENDING: failed to parse database type 'tstzrange'
    partitionRange: tstzrange('partition_range').notNull(),
  },
  (table) => [
    index('custom_time_partitions_partition_range_idx').using(
      'gist',
      table.partitionRange.asc().nullsLast().op('range_ops')
    ),
    primaryKey({
      columns: [table.parentTable, table.childTable],
      name: 'custom_time_partitions_pkey',
    }),
  ]
);

export const tenantConfigInStorefront = storefront.table(
  'tenant_config',
  {
    key: varchar({ length: 100 }).notNull(),
    tenantId: uuid('tenant_id').notNull(),
    value: jsonb().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_tenant_config_tenant_active').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    primaryKey({
      columns: [table.key, table.tenantId],
      name: 'tenant_config_pkey',
    }),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
    check('chk_config_key', sql`(key)::text ~ '^[a-zA-Z0-9_]+$'::text`),
    check('chk_tc_value_size', sql`pg_column_size(value) <= 102400`),
  ]
);
export const geographyColumns = pgView('geography_columns', {
  // PENDING: failed to parse database type 'name'
  fTableCatalog: pgName('f_table_catalog'),
  // PENDING: failed to parse database type 'name'
  fTableSchema: pgName('f_table_schema'),
  // PENDING: failed to parse database type 'name'
  fTableName: pgName('f_table_name'),
  // PENDING: failed to parse database type 'name'
  fGeographyColumn: pgName('f_geography_column'),
  coordDimension: integer('coord_dimension'),
  srid: integer(),
  type: text(),
}).as(
  sql`SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, postgis_typmod_dims(a.atttypmod) AS coord_dimension, postgis_typmod_srid(a.atttypmod) AS srid, postgis_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`
);

export const geometryColumns = pgView('geometry_columns', {
  fTableCatalog: varchar('f_table_catalog', { length: 256 }),
  // PENDING: failed to parse database type 'name'
  fTableSchema: pgName('f_table_schema'),
  // PENDING: failed to parse database type 'name'
  fTableName: pgName('f_table_name'),
  // PENDING: failed to parse database type 'name'
  fGeometryColumn: pgName('f_geometry_column'),
  coordDimension: integer('coord_dimension'),
  srid: integer(),
  type: varchar({ length: 30 }),
}).as(
  sql`SELECT current_database()::character varying(256) AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geometry_column, COALESCE(postgis_typmod_dims(a.atttypmod), sn.ndims, 2) AS coord_dimension, COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), sr.srid, 0) AS srid, replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), st.type, 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_type t ON a.atttypid = t.oid LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ''''::text, 2), ')'::text, ''::text) AS type FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%geometrytype(% = %'::text) st ON st.connamespace = n.oid AND st.conrelid = c.oid AND (a.attnum = ANY (st.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text)::integer AS ndims FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%ndims(% = %'::text) sn ON sn.connamespace = n.oid AND sn.conrelid = c.oid AND (a.attnum = ANY (sn.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text), '('::text, ''::text)::integer AS srid FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%srid(% = %'::text) sr ON sr.connamespace = n.oid AND sr.conrelid = c.oid AND (a.attnum = ANY (sr.conkey)) WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`
);

export const tablePrivs = pgView('table_privs', {
  // PENDING: failed to parse database type 'name'
  grantor: pgName('grantor'),
  // PENDING: failed to parse database type 'name'
  grantee: pgName('grantee'),
  // PENDING: failed to parse database type 'name'
  tableSchema: pgName('table_schema'),
  // PENDING: failed to parse database type 'name'
  tableName: pgName('table_name'),
  privilegeType: text('privilege_type'),
}).as(
  sql`SELECT u_grantor.rolname AS grantor, grantee.rolname AS grantee, nc.nspname AS table_schema, c.relname AS table_name, c.prtype AS privilege_type FROM ( SELECT pg_class.oid, pg_class.relname, pg_class.relnamespace, pg_class.relkind, pg_class.relowner, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).grantor AS grantor, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).grantee AS grantee, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).privilege_type AS privilege_type, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).is_grantable AS is_grantable FROM pg_class) c(oid, relname, relnamespace, relkind, relowner, grantor, grantee, prtype, grantable), pg_namespace nc, pg_roles u_grantor, ( SELECT pg_roles.oid, pg_roles.rolname FROM pg_roles UNION ALL SELECT 0::oid AS oid, 'PUBLIC'::name) grantee(oid, rolname) WHERE c.relnamespace = nc.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'p'::"char"])) AND c.grantee = grantee.oid AND c.grantor = u_grantor.oid AND (c.prtype = ANY (ARRAY['INSERT'::text, 'SELECT'::text, 'UPDATE'::text, 'DELETE'::text, 'TRUNCATE'::text, 'REFERENCES'::text, 'TRIGGER'::text])) AND (pg_has_role(u_grantor.oid, 'USAGE'::text) OR pg_has_role(grantee.oid, 'USAGE'::text) OR grantee.rolname = 'PUBLIC'::name)`
);

export const activeProductsInStorefront = storefront
  .view('active_products', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    brandId: uuid('brand_id'),
    categoryId: uuid('category_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    basePrice: numeric('base_price', { precision: 12, scale: 4 }),
    salePrice: numeric('sale_price', { precision: 12, scale: 4 }),
    costPrice: numeric('cost_price', { precision: 12, scale: 4 }),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 4 }),
    taxBasisPoints: integer('tax_basis_points'),
    lowStockThreshold: integer('low_stock_threshold'),
    soldCount: integer('sold_count'),
    viewCount: integer('view_count'),
    reviewCount: integer('review_count'),
    weight: integer(),
    minOrderQty: integer('min_order_qty'),
    isActive: boolean('is_active'),
    isFeatured: boolean('is_featured'),
    isReturnable: boolean('is_returnable'),
    requiresShipping: boolean('requires_shipping'),
    isDigital: boolean('is_digital'),
    trackInventory: boolean('track_inventory'),
    slug: varchar({ length: 255 }),
    sku: varchar({ length: 100 }),
    barcode: varchar({ length: 50 }),
    countryOfOrigin: varchar('country_of_origin', { length: 100 }),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    mainImage: text('main_image'),
    videoUrl: text('video_url'),
    digitalFileUrl: text('digital_file_url'),
    keywords: text(),
    avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
    tags: text(),
    name: jsonb(),
    shortDescription: jsonb('short_description'),
    longDescription: jsonb('long_description'),
    specifications: jsonb(),
    dimensions: jsonb(),
    galleryImages: jsonb('gallery_images'),
    embedding: vector({ dimensions: 1536 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    version: bigint({ mode: 'number' }),
    warrantyPeriod: integer('warranty_period'),
    warrantyUnit: varchar('warranty_unit', { length: 10 }),
  })
  .as(
    sql`SELECT _products.id, _products.tenant_id, _products.brand_id, _products.category_id, _products.created_at, _products.updated_at, _products.published_at, _products.deleted_at, _products.base_price, _products.sale_price, _products.cost_price, _products.compare_at_price, _products.tax_basis_points, _products.low_stock_threshold, _products.sold_count, _products.view_count, _products.review_count, _products.weight, _products.min_order_qty, _products.is_active, _products.is_featured, _products.is_returnable, _products.requires_shipping, _products.is_digital, _products.track_inventory, _products.slug, _products.sku, _products.barcode, _products.country_of_origin, _products.meta_title, _products.meta_description, _products.main_image, _products.video_url, _products.digital_file_url, _products.keywords, _products.avg_rating, _products.tags, _products.name, _products.short_description, _products.long_description, _products.specifications, _products.dimensions, _products.gallery_images, _products.embedding, _products.version, _products.warranty_period, _products.warranty_unit FROM storefront._products WHERE _products.deleted_at IS NULL`
  );

export const activeOrdersInStorefront = storefront
  .view('active_orders', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    customerId: uuid('customer_id'),
    marketId: uuid('market_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
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
    subtotal: numeric({ precision: 12, scale: 4 }),
    discount: numeric({ precision: 12, scale: 4 }),
    shipping: numeric({ precision: 12, scale: 4 }),
    tax: numeric({ precision: 12, scale: 4 }),
    total: numeric({ precision: 12, scale: 4 }),
    couponDiscount: numeric('coupon_discount', { precision: 12, scale: 4 }),
    refundedAmount: numeric('refunded_amount', { precision: 12, scale: 4 }),
    riskScore: integer('risk_score'),
    isFlagged: boolean('is_flagged'),
    status: orderStatus(),
    paymentStatus: paymentStatus('payment_status'),
    paymentMethod: paymentMethod('payment_method'),
    source: orderSource(),
    orderNumber: varchar('order_number', { length: 20 }),
    couponCode: varchar('coupon_code', { length: 50 }),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    guestEmail: varchar('guest_email', { length: 255 }),
    cancelReason: text('cancel_reason'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    trackingUrl: text('tracking_url'),
    notes: text(),
    tags: text(),
    shippingAddress: jsonb('shipping_address'),
    billingAddress: jsonb('billing_address'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    version: bigint({ mode: 'number' }),
    lockVersion: integer('lock_version'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    deviceFingerprint: varchar('device_fingerprint', { length: 64 }),
    paymentGatewayReference: varchar('payment_gateway_reference', {
      length: 255,
    }),
  })
  .as(
    sql`SELECT orders.id, orders.tenant_id, orders.customer_id, orders.market_id, orders.created_at, orders.updated_at, orders.shipped_at, orders.delivered_at, orders.cancelled_at, orders.deleted_at, orders.subtotal, orders.discount, orders.shipping, orders.tax, orders.total, orders.coupon_discount, orders.refunded_amount, orders.risk_score, orders.is_flagged, orders.status, orders.payment_status, orders.payment_method, orders.source, orders.order_number, orders.coupon_code, orders.tracking_number, orders.guest_email, orders.cancel_reason, orders.ip_address, orders.user_agent, orders.tracking_url, orders.notes, orders.tags, orders.shipping_address, orders.billing_address, orders.version, orders.lock_version, orders.idempotency_key, orders.device_fingerprint, orders.payment_gateway_reference FROM storefront.orders WHERE orders.deleted_at IS NULL`
  );

export const activeTenantsInGovernance = governance
  .view('active_tenants', {
    id: uuid(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    trialEndsAt: timestamp('trial_ends_at', {
      withTimezone: true,
      mode: 'string',
    }),
    suspendedAt: timestamp('suspended_at', {
      withTimezone: true,
      mode: 'string',
    }),
    plan: tenantPlan(),
    status: tenantStatus(),
    subdomain: text(),
    customDomain: text('custom_domain'),
    name: text(),
    ownerEmail: jsonb('owner_email'),
    ownerEmailHash: text('owner_email_hash'),
    suspendedReason: text('suspended_reason'),
    nicheType: text('niche_type'),
    nicheTypeHash: text('niche_type_hash'),
    uiConfig: jsonb('ui_config'),
    dataRegion: char('data_region', { length: 2 }),
    timezone: varchar({ length: 50 }),
  })
  .as(
    sql`SELECT tenants.id, tenants.created_at, tenants.updated_at, tenants.deleted_at, tenants.trial_ends_at, tenants.suspended_at, tenants.plan, tenants.status, tenants.subdomain, tenants.custom_domain, tenants.name, tenants.owner_email, tenants.owner_email_hash, tenants.suspended_reason, tenants.niche_type, tenants.niche_type_hash, tenants.ui_config, tenants.data_region, tenants.timezone FROM governance.tenants WHERE tenants.deleted_at IS NULL`
  );

export const importJobsInStorefront = storefront.table(
  'import_jobs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    adminId: uuid('admin_id').notNull(),
    status: varchar({ length: 20 }).default('pending').notNull(),
    fileUrl: text('file_url').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    totalRows: integer('total_rows').default(0).notNull(),
    processedRows: integer('processed_rows').default(0).notNull(),
    successRows: integer('success_rows').default(0).notNull(),
    errorRows: integer('error_rows').default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'string',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_import_jobs_tenant').using(
      'btree',
      table.tenantId.asc().nullsLast().op('uuid_ops')
    ),
    unique('uq_tenant_import_jobs_composite').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const newsletterSubscribersInStorefront = storefront.table(
  'newsletter_subscribers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    email: varchar({ length: 255 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    subscribedAt: timestamp('subscribed_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('uq_tenant_subscriber_email').on(table.tenantId, table.email),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = (current_setting('app.current_tenant'::text, false))::uuid)`,
    }),
    pgPolicy('tenant_isolation_policy', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
    }),
  ]
);

export const categoriesInStorefrontView = storefront
  .view('categories', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    parentId: uuid('parent_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    sortOrder: integer('sort_order'),
    productsCount: integer('products_count'),
    isActive: boolean('is_active'),
    slug: varchar({ length: 255 }),
    icon: varchar({ length: 100 }),
    metaTitle: varchar('meta_title', { length: 150 }),
    metaDescription: varchar('meta_description', { length: 255 }),
    imageUrl: text('image_url'),
    bannerUrl: text('banner_url'),
    name: jsonb(),
    description: jsonb(),
    // PENDING: failed to parse database type 'ltree'
    path: ltree('path'),
  })
  .as(
    sql`SELECT _categories.id, _categories.tenant_id, _categories.parent_id, _categories.created_at, _categories.updated_at, _categories.deleted_at, _categories.sort_order, _categories.products_count, _categories.is_active, _categories.slug, _categories.icon, _categories.meta_title, _categories.meta_description, _categories.image_url, _categories.banner_url, _categories.name, _categories.description, _categories.path FROM storefront._categories WHERE _categories.deleted_at IS NULL`
  );

export const productsInStorefrontView = storefront
  .view('products', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    brandId: uuid('brand_id'),
    categoryId: uuid('category_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    basePrice: numeric('base_price', { precision: 12, scale: 4 }),
    salePrice: numeric('sale_price', { precision: 12, scale: 4 }),
    costPrice: numeric('cost_price', { precision: 12, scale: 4 }),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 4 }),
    taxBasisPoints: integer('tax_basis_points'),
    lowStockThreshold: integer('low_stock_threshold'),
    soldCount: integer('sold_count'),
    viewCount: integer('view_count'),
    reviewCount: integer('review_count'),
    weight: integer(),
    minOrderQty: integer('min_order_qty'),
    isActive: boolean('is_active'),
    isFeatured: boolean('is_featured'),
    isReturnable: boolean('is_returnable'),
    requiresShipping: boolean('requires_shipping'),
    isDigital: boolean('is_digital'),
    trackInventory: boolean('track_inventory'),
    slug: varchar({ length: 255 }),
    sku: varchar({ length: 100 }),
    barcode: varchar({ length: 50 }),
    countryOfOrigin: varchar('country_of_origin', { length: 100 }),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    mainImage: text('main_image'),
    videoUrl: text('video_url'),
    digitalFileUrl: text('digital_file_url'),
    keywords: text(),
    avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
    tags: text(),
    name: jsonb(),
    shortDescription: jsonb('short_description'),
    longDescription: jsonb('long_description'),
    specifications: jsonb(),
    dimensions: jsonb(),
    galleryImages: jsonb('gallery_images'),
    embedding: vector({ dimensions: 1536 }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    version: bigint({ mode: 'number' }),
    warrantyPeriod: integer('warranty_period'),
    warrantyUnit: varchar('warranty_unit', { length: 10 }),
  })
  .as(
    sql`SELECT _products.id, _products.tenant_id, _products.brand_id, _products.category_id, _products.created_at, _products.updated_at, _products.published_at, _products.deleted_at, _products.base_price, _products.sale_price, _products.cost_price, _products.compare_at_price, _products.tax_basis_points, _products.low_stock_threshold, _products.sold_count, _products.view_count, _products.review_count, _products.weight, _products.min_order_qty, _products.is_active, _products.is_featured, _products.is_returnable, _products.requires_shipping, _products.is_digital, _products.track_inventory, _products.slug, _products.sku, _products.barcode, _products.country_of_origin, _products.meta_title, _products.meta_description, _products.main_image, _products.video_url, _products.digital_file_url, _products.keywords, _products.avg_rating, _products.tags, _products.name, _products.short_description, _products.long_description, _products.specifications, _products.dimensions, _products.gallery_images, _products.embedding, _products.version, _products.warranty_period, _products.warranty_unit FROM storefront._products WHERE _products.deleted_at IS NULL`
  );

export const pagesInStorefrontView = storefront
  .view('pages', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    isPublished: boolean('is_published'),
    slug: varchar({ length: 255 }),
    pageType: varchar('page_type', { length: 50 }),
    template: varchar({ length: 50 }),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    title: jsonb(),
    content: jsonb(),
  })
  .as(
    sql`SELECT _pages.id, _pages.tenant_id, _pages.created_at, _pages.updated_at, _pages.deleted_at, _pages.is_published, _pages.slug, _pages.page_type, _pages.template, _pages.meta_title, _pages.meta_description, _pages.title, _pages.content FROM storefront._pages WHERE _pages.deleted_at IS NULL`
  );

export const customersInStorefrontView = storefront
  .view('customers', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    lastLoginAt: timestamp('last_login_at', {
      withTimezone: true,
      mode: 'string',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    dateOfBirth: date('date_of_birth'),
    walletBalance: numeric('wallet_balance', { precision: 12, scale: 4 }),
    totalSpentAmount: numeric('total_spent_amount', {
      precision: 12,
      scale: 4,
    }),
    loyaltyPoints: integer('loyalty_points'),
    totalOrdersCount: integer('total_orders_count'),
    isVerified: boolean('is_verified'),
    acceptsMarketing: boolean('accepts_marketing'),
    email: jsonb(),
    emailHash: char('email_hash', { length: 64 }),
    passwordHash: text('password_hash'),
    firstName: jsonb('first_name'),
    lastName: jsonb('last_name'),
    phone: jsonb(),
    phoneHash: char('phone_hash', { length: 64 }),
    avatarUrl: text('avatar_url'),
    gender: varchar({ length: 10 }),
    language: char({ length: 2 }),
    notes: text(),
    tags: text(),
    version: integer(),
    lockVersion: integer('lock_version'),
  })
  .as(
    sql`SELECT _customers.id, _customers.tenant_id, _customers.created_at, _customers.updated_at, _customers.last_login_at, _customers.deleted_at, _customers.date_of_birth, _customers.wallet_balance, _customers.total_spent_amount, _customers.loyalty_points, _customers.total_orders_count, _customers.is_verified, _customers.accepts_marketing, _customers.email, _customers.email_hash, _customers.password_hash, _customers.first_name, _customers.last_name, _customers.phone, _customers.phone_hash, _customers.avatar_url, _customers.gender, _customers.language, _customers.notes, _customers.tags, _customers.version, _customers.lock_version FROM storefront._customers WHERE _customers.deleted_at IS NULL`
  );

export const ordersInStorefrontView = storefront
  .view('orders', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    customerId: uuid('customer_id'),
    marketId: uuid('market_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
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
    subtotal: numeric({ precision: 12, scale: 4 }),
    discount: numeric({ precision: 12, scale: 4 }),
    shipping: numeric({ precision: 12, scale: 4 }),
    tax: numeric({ precision: 12, scale: 4 }),
    total: numeric({ precision: 12, scale: 4 }),
    couponDiscount: numeric('coupon_discount', { precision: 12, scale: 4 }),
    refundedAmount: numeric('refunded_amount', { precision: 12, scale: 4 }),
    riskScore: integer('risk_score'),
    isFlagged: boolean('is_flagged'),
    status: orderStatus(),
    paymentStatus: paymentStatus('payment_status'),
    paymentMethod: paymentMethod('payment_method'),
    source: orderSource(),
    orderNumber: varchar('order_number', { length: 20 }),
    couponCode: varchar('coupon_code', { length: 50 }),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    guestEmail: varchar('guest_email', { length: 255 }),
    cancelReason: text('cancel_reason'),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    trackingUrl: text('tracking_url'),
    notes: text(),
    tags: text(),
    shippingAddress: jsonb('shipping_address'),
    billingAddress: jsonb('billing_address'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    version: bigint({ mode: 'number' }),
    lockVersion: integer('lock_version'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    deviceFingerprint: varchar('device_fingerprint', { length: 64 }),
    paymentGatewayReference: varchar('payment_gateway_reference', {
      length: 255,
    }),
  })
  .as(
    sql`SELECT _orders.id, _orders.tenant_id, _orders.customer_id, _orders.market_id, _orders.created_at, _orders.updated_at, _orders.shipped_at, _orders.delivered_at, _orders.cancelled_at, _orders.deleted_at, _orders.subtotal, _orders.discount, _orders.shipping, _orders.tax, _orders.total, _orders.coupon_discount, _orders.refunded_amount, _orders.risk_score, _orders.is_flagged, _orders.status, _orders.payment_status, _orders.payment_method, _orders.source, _orders.order_number, _orders.coupon_code, _orders.tracking_number, _orders.guest_email, _orders.cancel_reason, _orders.ip_address, _orders.user_agent, _orders.tracking_url, _orders.notes, _orders.tags, _orders.shipping_address, _orders.billing_address, _orders.version, _orders.lock_version, _orders.idempotency_key, _orders.device_fingerprint, _orders.payment_gateway_reference FROM storefront._orders WHERE _orders.deleted_at IS NULL`
  );

export const brandsInStorefrontView = storefront
  .view('brands', {
    id: uuid(),
    tenantId: uuid('tenant_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    isActive: boolean('is_active'),
    slug: varchar({ length: 255 }),
    country: char({ length: 2 }),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),
    name: jsonb(),
    description: jsonb(),
  })
  .as(
    sql`SELECT _brands.id, _brands.tenant_id, _brands.created_at, _brands.updated_at, _brands.deleted_at, _brands.is_active, _brands.slug, _brands.country, _brands.website_url, _brands.logo_url, _brands.name, _brands.description FROM storefront._brands WHERE _brands.deleted_at IS NULL`
  );
