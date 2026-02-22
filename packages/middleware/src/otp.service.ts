import { Injectable, Logger } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { RedisRateLimitStore } from './redis-rate-limit-store.js';

@Injectable()
export class OTPService {
  private readonly logger = new Logger(OTPService.name);

  constructor(private readonly store: RedisRateLimitStore) {}

  /**
   * S14: Generate a 6-digit OTP for payment attempts
   */
  async generateOTP(identifier: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${identifier}`;

    const client = await this.store.getClient();
    if (client) {
      // Valid for 5 minutes (S14 Strict)
      await client.setEx(key, 300, otp);
    }

    this.logger.log(`[S14] OTP Generated for ${identifier}`);
    // In a real scenario, this would be sent via SMS/Email
    return otp;
  }

  /**
   * S14: Verify OTP code
   */
  async verifyOTP(identifier: string, code: string): Promise<boolean> {
    const key = `otp:${identifier}`;
    const client = await this.store.getClient();

    if (!client) return false;

    const storedOtp = await client.get(key);
    if (storedOtp === code) {
      await client.del(key);
      return true;
    }

    return false;
  }
}
