import { RedisRateLimitStore } from '@apex/middleware';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';

@Injectable()
export class ActiveDefenseService {
  private readonly logger = new Logger(ActiveDefenseService.name);
  private readonly VIOLATION_THRESHOLD = 3;
  private readonly BAN_DURATION_SECONDS = 86400; // 24 hours

  constructor(
    @Inject(RedisRateLimitStore)
    private readonly redisStore: RedisRateLimitStore,
    private readonly cloudflareService: CloudflareService
  ) {}

  /**
   * S15: Track a security violation and trigger an automated ban if threshold is reached.
   */
  async trackViolation(ip: string, evidence: string): Promise<void> {
    const redis = await this.redisStore.getClient();
    if (!redis) {
      this.logger.warn(
        `S15: Redis unavailable. Failed to track violation for IP: ${ip}`
      );
      return;
    }

    const key = `v1:security:violations:${ip}`;

    try {
      // Increment violation count
      const count = await redis.incr(key);

      // Set expiration if it's the first violation
      if (count === 1) {
        await redis.expire(key, this.BAN_DURATION_SECONDS);
      }

      this.logger.warn(
        `S15 Violation Detected! IP: ${ip} | Count: ${count}/${this.VIOLATION_THRESHOLD} | Evidence: ${evidence}`
      );

      // Check if threshold is reached
      if (count >= this.VIOLATION_THRESHOLD) {
        this.logger.error(
          `S15 CRITICAL: Threshold reached for IP ${ip}. Triggering automated edge ban.`
        );
        await this.executeEdgeBan(ip, evidence);
      }
    } catch (error) {
      this.logger.error(
        `S15: Error tracking violation for IP ${ip}: ${(error as Error).message}`
      );
    }
  }

  /**
   * S15 Executioner: Coordinate the ban across edge providers
   */
  private async executeEdgeBan(ip: string, evidence: string): Promise<void> {
    // 1. Trigger Cloudflare API Ban
    const success = await this.cloudflareService.blockIp(
      ip,
      `Honeytoken Violation: ${evidence}`
    );

    if (success) {
      this.logger.log(
        `🛡️ S15: IP ${ip} has been successfully dropped at the Cloudflare edge.`
      );
    } else {
      this.logger.error(
        `❌ S15: Automated Cloudflare ban FAILED for IP ${ip}. Manual intervention required.`
      );
    }
  }
}
