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
  metadata: z.record(z.string(), z.unknown()).optional(),
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
    ipAddress: z
      .string()
      .regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))$/
      ),
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

import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
// ==========================================
// Persistent Event Bus (BullMQ)
// S14.7: Durable Event-Driven Architecture
// ==========================================
import { type Job, Queue, Worker } from 'bullmq';

@Injectable()
export class BullMQEventBus implements EventBus, OnModuleDestroy {
  private queue: Queue;
  private readonly logger = new Logger(BullMQEventBus.name);

  constructor(redisUrl: string) {
    this.queue = new Queue('global-events', {
      connection: { url: redisUrl },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      },
    });
  }

  async publish<T extends ApexEvent>(event: T): Promise<void> {
    await this.queue.add(event.eventType, event, {
      jobId: event.eventId, // Ensure idempotency
    });
    this.logger.debug(`Published event ${event.eventType} (${event.eventId})`);
  }

  // Subscribe is handled by EventsWorker in BullMQ implementation
  subscribe<T extends ApexEvent>(
    _eventType: T['eventType'],
    _handler: (event: T) => Promise<void>
  ): void {
    throw new Error('Use EventsWorker to subscribe to BullMQ events');
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}

@Injectable()
export class EventsWorker implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker;
  private readonly logger = new Logger(EventsWorker.name);
  private handlers: Map<string, Array<(event: ApexEvent) => Promise<void>>> =
    new Map();

  constructor(private readonly redisUrl: string) {}

  onModuleInit() {
    // S14.7: Dedicated Worker Pattern
    if (process.env['ENABLE_WORKERS'] !== 'true') {
      return;
    }

    this.worker = new Worker(
      'global-events',
      async (job: Job) => {
        const event = job.data as ApexEvent;
        const handlers = this.handlers.get(event.eventType) || [];

        await Promise.all(
          handlers.map(async (handler) => {
            try {
              await handler(event);
            } catch (err) {
              this.logger.error(
                `Handler failed for event ${event.eventType}:`,
                err
              );
              throw err; // Trigger BullMQ retry
            }
          })
        );
      },
      {
        connection: { url: this.redisUrl },
        concurrency: 5,
      }
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Event job ${job?.id} failed:`, err);
    });

    this.logger.log('Events worker started');
  }

  subscribe<T extends ApexEvent>(
    eventType: T['eventType'],
    handler: (event: T) => Promise<void>
  ): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler as (event: ApexEvent) => Promise<void>);
    this.handlers.set(eventType, existing);
  }

  async onModuleDestroy() {
    await this.worker?.close();
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

import {
  type DynamicModule,
  type FactoryProvider,
  Module,
} from '@nestjs/common';

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS module pattern
export class EventsModule {
  static register(redisUrl: string): DynamicModule {
    return {
      module: EventsModule,
      providers: [
        {
          provide: 'REDIS_URL',
          useValue: redisUrl,
        },
        {
          provide: BullMQEventBus,
          useFactory: (url: string) => new BullMQEventBus(url),
          inject: ['REDIS_URL'],
        },
        {
          provide: EventsWorker,
          useFactory: (url: string) => new EventsWorker(url),
          inject: ['REDIS_URL'],
        },
        {
          provide: 'EVENT_BUS',
          useExisting: BullMQEventBus,
        },
      ],
      exports: ['EVENT_BUS', BullMQEventBus, EventsWorker],
    };
  }

  static registerAsync(options: {
    imports?: DynamicModule['imports'];
    useFactory: (...args: unknown[]) => Promise<string> | string;
    inject?: FactoryProvider['inject'];
  }): DynamicModule {
    return {
      module: EventsModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'REDIS_URL',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: BullMQEventBus,
          useFactory: (url: string) => new BullMQEventBus(url),
          inject: ['REDIS_URL'],
        },
        {
          provide: EventsWorker,
          useFactory: (url: string) => new EventsWorker(url),
          inject: ['REDIS_URL'],
        },
        {
          provide: 'EVENT_BUS',
          useExisting: BullMQEventBus,
        },
      ],
      exports: ['EVENT_BUS', BullMQEventBus, EventsWorker],
    };
  }
}
