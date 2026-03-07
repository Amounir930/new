// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ConfigService } from '@apex/config';
import { Injectable, Logger } from '@nestjs/common';

interface HCaptchaResponse {
  success: boolean;
  'error-codes'?: string[];
}

@Injectable()
export class HCaptchaService {
  private readonly logger = new Logger(HCaptchaService.name);
  private readonly secretKey: string;
  private readonly siteKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get('HCAPTCHA_SECRET_KEY') || '';
    this.siteKey = this.configService.get('HCAPTCHA_SITE_KEY') || '';
  }

  /**
   * S11: Verify hCaptcha response token
   */
  async verify(token: string, remoteIp?: string): Promise<boolean> {
    if (!token) {
      this.logger.warn('HCAPTCHA: No token provided');
      return false;
    }

    if (!this.secretKey) {
      this.logger.error(
        'HCAPTCHA: S1 Violation - HCAPTCHA_SECRET_KEY not configured'
      );
      return false;
    }

    try {
      const response = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: this.secretKey,
          response: token,
          ...(remoteIp && { remoteip: remoteIp }),
          sitekey: this.siteKey,
        }),
      });

      const data = (await response.json()) as HCaptchaResponse;

      if (data.success) {
        return true;
      }

      this.logger.error(
        `HCAPTCHA: Verification failed - Errors: ${JSON.stringify(data['error-codes'])}`
      );
      return false;
    } catch (error) {
      this.logger.error('HCAPTCHA: System error during verification', error);
      return false;
    }
  }
}
