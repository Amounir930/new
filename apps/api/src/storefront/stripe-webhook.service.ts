import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { env } from '@apex/config/server';
import { getTenantDb, ordersInStorefront, paymentLogsInStorefront, eq, sql } from '@apex/db';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

/**
 * ── STRIPE WEBHOOK SERVICE ──
 * Processes Stripe webhook events idempotently.
 *
 * Idempotency strategy:
 * - All status transitions use WHERE payment_status='pending'
 * - Redundant webhook deliveries are safe no-ops
 * - Tenant isolation enforced via getTenantDb() with metadata.tenant_id
 */
@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(private readonly stripeService: StripeService) { }

  /**
   * Handle a raw webhook event from Stripe.
   */
  async handleEvent(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.stripeService.verifyWebhookSignature(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    this.logger.log(`Processing Stripe webhook: ${event.type} (id: ${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event);
        break;

      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  /**
   * Handle payment_intent.succeeded
   * Transition order from 'pending' to 'paid' idempotently.
   */
  private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { order_id, tenant_id, schema_name } = paymentIntent.metadata || {};

    if (!order_id || !tenant_id) {
      this.logger.error(
        `PaymentIntent ${paymentIntent.id} missing order_id or tenant_id metadata`
      );
      return;
    }

    const { db, release } = await getTenantDb(tenant_id, schema_name);

    try {
      // Idempotent update: only transition if still 'pending'
      const updateResult = await db
        .update(ordersInStorefront)
        .set({
          paymentStatus: 'paid',
          status: 'processing',
          paymentGatewayReference: paymentIntent.id,
          updatedAt: new Date().toISOString(),
        })
        .where(
          sql`${ordersInStorefront.id} = ${order_id} AND ${ordersInStorefront.paymentStatus} = 'pending'`
        );

      // Update payment log
      await db
        .update(paymentLogsInStorefront)
        .set({
          status: 'paid',
          transactionId: paymentIntent.id,
          providerReferenceId: paymentIntent.id,
          rawResponse: this.scrubRawResponse(paymentIntent),
        })
        .where(
          sql`${paymentLogsInStorefront.orderId} = ${order_id} AND ${paymentLogsInStorefront.status} = 'pending'`
        );

      const rowCount = (updateResult as { rowCount?: number })?.rowCount ?? 0;
      if (rowCount > 0) {
        this.logger.log(
          `Order ${order_id} marked as PAID (PaymentIntent: ${paymentIntent.id})`
        );
      } else {
        this.logger.log(
          `Order ${order_id} was already processed (idempotent no-op)`
        );
      }
    } finally {
      release();
    }
  }

  /**
   * Handle payment_intent.payment_failed
   * Transition order to 'failed'.
   */
  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { order_id, tenant_id, schema_name } = paymentIntent.metadata || {};

    if (!order_id || !tenant_id) {
      this.logger.error(
        `PaymentIntent ${paymentIntent.id} missing metadata`
      );
      return;
    }

    const { db, release } = await getTenantDb(tenant_id, schema_name);

    try {
      await db
        .update(ordersInStorefront)
        .set({
          paymentStatus: 'failed',
          updatedAt: new Date().toISOString(),
        })
        .where(
          sql`${ordersInStorefront.id} = ${order_id} AND ${ordersInStorefront.paymentStatus} = 'pending'`
        );

      const lastPaymentError =
        (paymentIntent.last_payment_error?.message as string | undefined) ??
        'Payment failed';

      await db
        .update(paymentLogsInStorefront)
        .set({
          status: 'failed',
          transactionId: paymentIntent.id,
          errorMessage: lastPaymentError,
          rawResponse: this.scrubRawResponse(paymentIntent),
        })
        .where(
          sql`${paymentLogsInStorefront.orderId} = ${order_id} AND ${paymentLogsInStorefront.status} = 'pending'`
        );

      this.logger.warn(
        `Order ${order_id} marked as FAILED: ${lastPaymentError}`
      );
    } finally {
      release();
    }
  }

  /**
   * Handle payment_intent.canceled
   * Transition order to 'cancelled'.
   */
  private async handlePaymentCanceled(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { order_id, tenant_id, schema_name } = paymentIntent.metadata || {};

    if (!order_id || !tenant_id) {
      this.logger.error(
        `PaymentIntent ${paymentIntent.id} missing metadata`
      );
      return;
    }

    const { db, release } = await getTenantDb(tenant_id, schema_name);

    try {
      await db
        .update(ordersInStorefront)
        .set({
          paymentStatus: 'failed',
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        })
        .where(
          sql`${ordersInStorefront.id} = ${order_id} AND ${ordersInStorefront.paymentStatus} = 'pending'`
        );

      await db
        .update(paymentLogsInStorefront)
        .set({
          status: 'failed',
          transactionId: paymentIntent.id,
          errorMessage: 'Payment canceled',
          rawResponse: this.scrubRawResponse(paymentIntent),
        })
        .where(
          sql`${paymentLogsInStorefront.orderId} = ${order_id} AND ${paymentLogsInStorefront.status} = 'pending'`
        );

      this.logger.warn(`Order ${order_id} marked as CANCELED`);
    } finally {
      release();
    }
  }

  /**
   * Scrub sensitive data from raw Stripe response before storing.
   * PCI compliance: never store CVV, full card number, or PAN.
   */
  private scrubRawResponse(
    paymentIntent: Stripe.PaymentIntent
  ): Record<string, unknown> {
    const scrubbed: Record<string, unknown> = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata,
    };

    // Only include last_payment_error message, not full object (may contain PAN)
    if (paymentIntent.last_payment_error?.message) {
      scrubbed.last_payment_error_message =
        paymentIntent.last_payment_error.message;
    }

    return scrubbed;
  }
}
