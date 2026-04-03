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
      this.logger.warn(`Simulating email to ${options.to}: [${options.subject}]`);
      if (env.NODE_ENV !== 'production') {
        this.logger.debug(`Email content: ${options.html || options.text}`);
      }
      return true; // Simulate success
    }

    try {
      const payload = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      } as import('resend').CreateEmailOptions;

      const response = await this.resend.emails.send(payload);

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

      this.logger.log(`Email successfully sent to ${options.to} (ID: ${response.data?.id})`);
      return true;
    } catch (error) {
      this.logger.error(`Exception while sending email to ${options.to}`, error);

      // Dev-Only: If Resend throws, log OTP to console
      if (env.NODE_ENV !== 'production') {
        const otpMatch = (options.html || options.text || '').match(
          /([0-9]{6})/
        );
        if (otpMatch) {
          this.logger.warn(
            `[DEV BYPASS] Resend exception. OTP for ${options.to}: ${otpMatch[1]}`
          );
        }
        return true; // Simulate success in dev
      }

      return false;
    }
  }
}
