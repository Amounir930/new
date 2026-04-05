import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { env } from '@apex/config/server';
import Stripe from 'stripe';

/**
 * ── STRIPE SERVICE ──
 * Wraps the official Stripe SDK.
 * Handles PaymentIntent creation and webhook verification.
 */
@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe!: Stripe;

  private get stripeClient(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe SDK not initialized. Check STRIPE_SECRET_KEY env var.'
      );
    }
    return this.stripe;
  }

  onModuleInit() {
    const apiKey = env.STRIPE_SECRET_KEY;

    if (!apiKey || apiKey === 'sk_test_dummy_key_for_dev') {
      this.logger.warn(
        'Stripe is using placeholder key — payment operations will fail in production'
      );
    }

    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      apiVersion: '2026-01-27.clover',
      typescript: true,
    });

    this.logger.log('Stripe SDK initialized');
  }

  /**
   * Create a Stripe PaymentIntent for an order.
   *
   * @param amount - Order total in the smallest currency unit (e.g., halalas for SAR)
   * @param currency - ISO 4217 currency code (e.g., 'sar')
   * @param orderId - The platform order ID (stored in metadata)
   * @param tenantId - The tenant UUID (stored in metadata)
   * @param customerId - Optional platform customer ID (stored in metadata)
   * @returns { clientSecret, paymentIntentId }
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    orderId: string;
    tenantId: string;
    schemaName?: string;
    customerId?: string | null;
    description?: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const { amount, currency, orderId, tenantId, schemaName, customerId, description } =
      params;

    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount,
      currency,
      metadata: {
        order_id: orderId,
        tenant_id: tenantId,
        ...(schemaName ? { schema_name: schemaName } : {}),
        ...(customerId ? { customer_id: customerId } : {}),
      },
      description: description ?? `Order ${orderId}`,
      // S10: Do NOT store raw card data — Stripe handles PCI compliance
    });

    if (!paymentIntent.client_secret) {
      throw new BadRequestException(
        'Stripe did not return a client_secret for the PaymentIntent'
      );
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Verify a Stripe webhook signature.
   *
   * @param rawBody - The raw request body buffer
   * @param signature - The stripe-signature header value
   * @param webhookSecret - The webhook signing secret (STRIPE_WEBHOOK_SECRET)
   * @returns The verified Stripe Event
   */
  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    return this.stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  }
}
