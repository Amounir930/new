/**
 * Centralized PG Enum Definitions
 *
 * All native PostgreSQL enums for the Apex v2 platform.
 * Each enum consumes only 4 bytes per row vs TEXT.
 *
 * ⚠️ ENUM LIFECYCLE POLICY:
 * - Values can be ADDED (`ALTER TYPE ... ADD VALUE`) but NOT removed.
 * - Document every value's meaning before adding.
 * - Mark frozen enums (❄️) vs extensible ones.
 *
 * @module @apex/db/schema/enums
 */

import { pgEnum } from 'drizzle-orm/pg-core';

// ─── Tenant Enums (Governance) ────────────────────────────────

/** ❄️ Frozen — core business logic depends on these values */
export const tenantPlanEnum = pgEnum('tenant_plan', [
  'free',
  'basic',
  'pro',
  'enterprise',
]);

/** ❄️ Frozen */
export const tenantStatusEnum = pgEnum('tenant_status', [
  'active',
  'suspended',
  'pending',
  'archived',
]);

/** Extensible — new niches can be added */
export const tenantNicheEnum = pgEnum('tenant_niche', [
  'retail',
  'wellness',
  'education',
  'services',
  'hospitality',
  'real-estate',
  'creative',
]);

/** ❄️ Frozen */
export const blueprintStatusEnum = pgEnum('blueprint_status', [
  'active',
  'paused',
]);

// ─── Order & Payment Enums ────────────────────────────────────

/** ❄️ Frozen — order lifecycle */
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]);

/** ❄️ Frozen — payment lifecycle */
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);

/** Extensible — new payment methods */
export const paymentMethodEnum = pgEnum('payment_method', [
  'card',
  'cod',
  'wallet',
  'bnpl',
  'bank_transfer',
]);

/** Extensible — order source */
export const orderSourceEnum = pgEnum('order_source', [
  'web',
  'mobile',
  'b2b',
  'pos',
]);

// ─── Fulfillment Enums ────────────────────────────────────────

/** ❄️ Frozen — shipping lifecycle */
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'pending',
  'shipped',
  'in_transit',
  'delivered',
  'failed',
]);

// ─── Audit Enums ──────────────────────────────────────────────

/** ❄️ Frozen */
export const severityEnum = pgEnum('audit_severity', [
  'INFO',
  'WARNING',
  'CRITICAL',
]);

/** ❄️ Frozen */
export const auditResultEnum = pgEnum('audit_result', ['SUCCESS', 'FAILURE']);

/** ❄️ Frozen */
export const actorTypeEnum = pgEnum('actor_type', [
  'super_admin',
  'tenant_admin',
  'system',
]);

// ─── Inventory Enums ──────────────────────────────────────────

/** Extensible */
export const locationTypeEnum = pgEnum('location_type', [
  'warehouse',
  'retail',
  'dropship',
]);

/** Extensible */
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'in',
  'out',
  'adjustment',
  'return',
  'transfer',
]);

/** ❄️ Frozen */
export const reservationStatusEnum = pgEnum('reservation_status', [
  'active',
  'converted',
  'expired',
]);

/** ❄️ Frozen */
export const transferStatusEnum = pgEnum('transfer_status', [
  'draft',
  'in_transit',
  'received',
  'cancelled',
]);

// ─── Supply Chain Enums ───────────────────────────────────────

/** ❄️ Frozen */
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'draft',
  'ordered',
  'partial',
  'received',
  'cancelled',
]);

// ─── Refund & RMA Enums ──────────────────────────────────────

/** ❄️ Frozen */
export const refundStatusEnum = pgEnum('refund_status', [
  'pending',
  'processed',
  'failed',
]);

/** Extensible — return reasons */
export const rmaReasonCodeEnum = pgEnum('rma_reason_code', [
  'defective',
  'wrong_item',
  'changed_mind',
  'not_as_described',
  'damaged_in_transit',
]);

/** ❄️ Frozen */
export const rmaConditionEnum = pgEnum('rma_condition', [
  'new',
  'opened',
  'damaged',
]);

/** ❄️ Frozen */
export const rmaResolutionEnum = pgEnum('rma_resolution', [
  'refund',
  'exchange',
  'store_credit',
]);

// ─── Discount Enums ──────────────────────────────────────────

/** Extensible */
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed',
  'buy_x_get_y',
  'free_shipping',
]);

/** Extensible */
export const discountAppliesToEnum = pgEnum('discount_applies_to', [
  'all',
  'specific_products',
  'specific_categories',
  'specific_customers',
]);

// ─── B2B Enums ───────────────────────────────────────────────

/** ❄️ Frozen */
export const b2bCompanyStatusEnum = pgEnum('b2b_company_status', [
  'active',
  'pending',
  'suspended',
]);

/** ❄️ Frozen */
export const b2bUserRoleEnum = pgEnum('b2b_user_role', [
  'admin',
  'buyer',
  'viewer',
]);

// ─── Affiliate Enums ─────────────────────────────────────────

/** ❄️ Frozen */
export const affiliateStatusEnum = pgEnum('affiliate_status', [
  'active',
  'pending',
  'suspended',
]);

/** ❄️ Frozen */
export const affiliateTransactionStatusEnum = pgEnum('affiliate_tx_status', [
  'pending',
  'approved',
  'paid',
  'rejected',
]);

// ─── Outbox Enums ────────────────────────────────────────────

/** ❄️ Frozen */
export const outboxStatusEnum = pgEnum('outbox_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// ─── Lead / CRM Enums ───────────────────────────────────────

/** Extensible */
export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'converted',
]);

// ─── Dunning Enums ──────────────────────────────────────────

/** ❄️ Frozen */
export const dunningStatusEnum = pgEnum('dunning_status', [
  'pending',
  'retried',
  'failed',
  'recovered',
]);

// ─── Invoice Enums ──────────────────────────────────────────

/** ❄️ Frozen */
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'issued',
  'paid',
  'overdue',
]);

// ─── Consent Enums ──────────────────────────────────────────

/** Extensible — communication channels */
export const consentChannelEnum = pgEnum('consent_channel', [
  'email',
  'sms',
  'push',
  'whatsapp',
]);
