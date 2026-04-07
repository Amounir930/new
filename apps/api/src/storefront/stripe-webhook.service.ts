import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { env } from '@apex/config/server';
import { getTenantDb, ordersInStorefront, paymentLogsInStorefront, eq, sql } from '@apex/db';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { NotificationsService } from '../common/notifications/notifications.service';

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

  constructor(
    private readonly stripeService: StripeService,
    private readonly notificationsService: NotificationsService,
  ) { }

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

        // Dispatch order confirmation email (fire-and-forget — never block webhook)
        this.dispatchOrderConfirmationEmail(
          tenant_id,
          schema_name,
          order_id,
          paymentIntent
        ).catch((err) =>
          this.logger.error(
            `Failed to send order confirmation email for ${order_id}`,
            err
          )
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

  /**
   * Dispatch order confirmation email after successful payment.
   * Fire-and-forget — errors are logged but never thrown to avoid
   * blocking the webhook response (Stripe expects a 200 within 3s).
   */
  private async dispatchOrderConfirmationEmail(
    tenantId: string,
    schemaName: string,
    orderId: string,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      const { db, release } = await getTenantDb(tenantId, schemaName);

      try {
        // Fetch order with customer email info
        const [order] = await db
          .select({
            orderNumber: ordersInStorefront.orderNumber,
            total: ordersInStorefront.total,
            guestEmail: ordersInStorefront.guestEmail,
            customerId: ordersInStorefront.customerId,
          })
          .from(ordersInStorefront)
          .where(eq(ordersInStorefront.id, orderId))
          .limit(1);

        if (!order) return;

        // Resolve recipient email: guest email takes priority (it's the checkout email),
        // otherwise we'd need to query the customers table for the customer's email.
        // For guest checkouts, guestEmail is always populated.
        const recipientEmail = order.guestEmail;
        if (!recipientEmail) {
          this.logger.debug(
            `No email address for order ${orderId} (customerId=${order.customerId}) — skipping confirmation email`
          );
          return;
        }

        const amountCents = paymentIntent.amount;
        const amountFormatted = amountCents
          ? (amountCents / 100).toFixed(2)
          : order.total;

        const subject = `Order Confirmation — #${order.orderNumber}`;
        const html = `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h1 style="margin:0 0 16px;font-size:24px;">Thank you for your order!</h1>
            <p style="color:#374151;margin:0 0 8px;">
              Your order <strong>#${order.orderNumber}</strong> has been confirmed and is being processed.
            </p>
            <p style="color:#374151;margin:0 0 24px;">
              Amount paid: <strong>$${amountFormatted}</strong>
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
            <p style="color:#6b7280;font-size:14px;margin:0;">
              Payment reference: <code>${paymentIntent.id}</code>
            </p>
          </div>
        `;

        const sent = await this.notificationsService.sendEmail({
          to: recipientEmail,
          subject,
          html,
          text: `Your order #${order.orderNumber} has been confirmed. Amount: $${amountFormatted}. Reference: ${paymentIntent.id}`,
        });

        if (sent) {
          this.logger.log(
            `Order confirmation email sent to ${recipientEmail} (Order ${order.orderNumber})`
          );
        }
      } finally {
        release();
      }
    } catch (error) {
      this.logger.error(
        `Error dispatching order confirmation email for ${orderId}`,
        error
      );
    }
  }
}
