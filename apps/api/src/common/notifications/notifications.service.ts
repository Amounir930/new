import { env } from '@apex/config/server';
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor() {
    this.fromEmail = env.RESEND_FROM_EMAIL || 'noreply@60sec.shop';
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
      this.logger.log('Resend SDK initialized.');
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email sending will be simulated or skipped.'
      );
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(
        `Simulating email to ${options.to}: [${options.subject}]`
      );
      if (env.NODE_ENV !== 'production') {
        this.logger.debug(`Email content: ${options.html || options.text}`);
      }
      return true; // Simulate success
    }

    // P0 FIX: Promise.race timeout wrapper to prevent server deadlock (524)
    const sendWithTimeout = (): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const timeoutId = setTimeout(
          () => reject(new Error('Email send timed out after 15s')),
          15000
        );

        const payload = {
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        } as import('resend').CreateEmailOptions;

        this.resend!.emails.send(payload)
          .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            reject(err);
          });
      });

    try {
      // biome-ignore lint/suspicious/noExplicitAny: Resend type is not directly importable
      const response: any = await sendWithTimeout();

      if (response.error) {
        this.logger.error(
          `Failed to send email to ${options.to}: ${response.error.message}`,
          response.error
        );

        // Dev-Only: If Resend fails due to unverified domain, log OTP to console
        if (env.NODE_ENV !== 'production') {
          const otpMatch = (options.html || options.text || '').match(
            /([0-9]{6})/
          );
          if (otpMatch) {
            this.logger.warn(
              `[DEV BYPASS] Resend domain unverified. OTP for ${options.to}: ${otpMatch[1]}`
            );
          }
          return true; // Simulate success in dev
        }

        return false;
      }

      this.logger.log(
        `Email successfully sent to ${options.to} (ID: ${response.data?.id})`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Exception while sending email to ${options.to}`,
        error
      );

      // P0 FIX: Dev bypass on timeout/abort — extract OTP and allow flow to continue
      if (env.NODE_ENV !== 'production') {
        const otpMatch = (options.html || options.text || '').match(
          /([0-9]{6})/
        );
        if (otpMatch) {
          this.logger.warn(
            `[DEV BYPASS] Email send failed (timeout/network). OTP for ${options.to}: ${otpMatch[1]}`
          );
        }
        return true; // Simulate success in dev
      }

      return false;
    }
  }
}
