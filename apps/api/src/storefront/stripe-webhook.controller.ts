import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { StripeWebhookService } from './stripe-webhook.service';

interface RawBodyReq extends Request {
  rawBody?: Buffer;
}

/**
 * ── STRIPE WEBHOOK CONTROLLER ──
 * POST /api/v1/storefront/webhooks/stripe
 *
 * Receives Stripe webhook events. No auth guard — security via
 * Stripe signature verification (stripe-signature header).
 *
 * Processed events:
 * - payment_intent.succeeded → order marked 'paid'
 * - payment_intent.payment_failed → order marked 'failed'
 * - payment_intent.canceled → order marked 'cancelled'
 */
@Controller({ path: 'storefront/webhooks/stripe', version: '1' })
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post()
  async handleWebhook(
    @Req() req: RawBodyReq,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException(
        'Raw body not available for webhook verification'
      );
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      await this.webhookService.handleEvent(rawBody, signature);
      res.status(200).json({ received: true });
    } catch (err) {
      this.logger.error(
        `Webhook processing failed: ${err instanceof Error ? err.message : String(err)}`
      );
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Webhook processing failed',
      });
    }
  }
}
