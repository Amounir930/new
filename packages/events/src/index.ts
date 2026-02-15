/**
 * Apex v2 Events Package
 * Constitution Reference: Pillar 1 (Rule 1.3), Pillar 3
 * Purpose: Typed event bus for cross-module communication
 */

import { z } from 'zod';

// ==========================================
// Base Event Schema (All events must extend)
// ==========================================
export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  timestamp: z.string().datetime(),
  tenantId: z.string().uuid(),
  correlationId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// ==========================================
// Provisioning Events (EPIC 1)
// ==========================================
export const TenantProvisioningStartedSchema = BaseEventSchema.extend({
  eventType: z.literal('tenant.provisioning.started'),
  payload: z.object({
    subdomain: z.string(),
    plan: z.enum(['free', 'basic', 'pro', 'enterprise']),
    adminEmail: z.string().email(),
    templateId: z.string().optional(),
  }),
});

export const TenantProvisioningCompletedSchema = BaseEventSchema.extend({
  eventType: z.literal('tenant.provisioning.completed'),
  payload: z.object({
    subdomain: z.string(),
    schemaName: z.string(),
    publicUrl: z.string().url(),
    durationMs: z.number().int().positive(),
  }),
});

export const TenantProvisioningFailedSchema = BaseEventSchema.extend({
  eventType: z.literal('tenant.provisioning.failed'),
  payload: z.object({
    subdomain: z.string(),
    errorCode: z.string(),
    errorMessage: z.string(),
    retryable: z.boolean(),
  }),
});

// ==========================================
// Payment Events (EPIC 2)
// ==========================================
export const PaymentConfirmedSchema = BaseEventSchema.extend({
  eventType: z.literal('payment.confirmed'),
  payload: z.object({
    orderId: z.string().uuid(),
    stripePaymentIntentId: z.string(),
    amount: z.number().positive(),
    currency: z.string().length(3),
  }),
});

export const PaymentFailedSchema = BaseEventSchema.extend({
  eventType: z.literal('payment.failed'),
  payload: z.object({
    orderId: z.string().uuid(),
    stripePaymentIntentId: z.string(),
    failureCode: z.string(),
    failureMessage: z.string(),
  }),
});

// ==========================================
// Audit Events (S4 Compliance)
// ==========================================
export const AuditEventSchema = BaseEventSchema.extend({
  eventType: z.literal('audit.record'),
  payload: z.object({
    action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT']),
    entityType: z.string(),
    entityId: z.string(),
    userId: z.string(),
    userEmail: z.string().email(),
    ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))$/),
    userAgent: z.string(),
    changes: z.record(z.unknown()).optional(),
  }),
});

// ==========================================
// Event Type Exports
// ==========================================
export type TenantProvisioningStarted = z.infer<
  typeof TenantProvisioningStartedSchema
>;
export type TenantProvisioningCompleted = z.infer<
  typeof TenantProvisioningCompletedSchema
>;
export type TenantProvisioningFailed = z.infer<
  typeof TenantProvisioningFailedSchema
>;
export type PaymentConfirmed = z.infer<typeof PaymentConfirmedSchema>;
export type PaymentFailed = z.infer<typeof PaymentFailedSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// Union of all event types
export type ApexEvent =
  | TenantProvisioningStarted
  | TenantProvisioningCompleted
  | TenantProvisioningFailed
  | PaymentConfirmed
  | PaymentFailed
  | AuditEvent;

// ==========================================
// Event Bus Interface (Rule 1.3)
// ==========================================
export interface EventBus {
  publish<T extends ApexEvent>(event: T): Promise<void>;
  subscribe<T extends ApexEvent>(
    eventType: T['eventType'],
    handler: (event: T) => Promise<void>
  ): void;
}

// ==========================================
// In-Memory Event Bus (Development)
// ==========================================
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Array<(event: ApexEvent) => Promise<void>>> =
    new Map();

  async publish<T extends ApexEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map((h) => h(event)));
  }

  subscribe<T extends ApexEvent>(
    eventType: T['eventType'],
    handler: (event: T) => Promise<void>
  ): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler as (event: ApexEvent) => Promise<void>);
    this.handlers.set(eventType, existing);
  }
}

// ==========================================
// Event Validation (S3 Compliance)
// ==========================================
export function validateEvent<T extends ApexEvent>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

// ==========================================
// Event Factory Helpers
// ==========================================
export function createEventId(): string {
  return crypto.randomUUID();
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function createTimestamp(): string {
  return new Date().toISOString();
}
