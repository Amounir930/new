import { Public } from '@apex/auth';
import type { ConfigService } from '@apex/config';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { RedisRateLimitStore } from '@apex/middleware';
import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Health Controller
 * S6: Active connectivity checks for security-critical services
 */
@Controller({ path: 'health', version: [VERSION_NEUTRAL, '1'] })
@Public()
@UseGuards(ThrottlerGuard) // S6 FIX: Apply rate limiting to public health endpoints
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redisStore: RedisRateLimitStore // S2 FIX 22A: Singleton, no per-request TCP churn
  ) {}

  @Get()
  rootCheck() {
    return {
      status: 'ok',
      message: 'Apex v2 API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('redis')
  async checkRedis() {
    // S2 FIX 22A: Reuse singleton Redis connection (no TCP Port Exhaustion)
    const client = await this.redisStore.getClient();
    if (!client) {
      this.logger.error('Redis connectivity failed: client unavailable');
      throw new ServiceUnavailableException('Redis service unavailable');
    }

    try {
      await client.ping();
      return {
        status: 'ok',
        service: 'redis',
        message: 'Redis connectivity verified',
      };
    } catch (error) {
      this.logger.error(
        `Redis connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new ServiceUnavailableException('Redis service unavailable');
    }
  }

  @Get('liveness')
  checkLiveness() {
    return { status: 'ok' };
  }

  checkStatus() {
    return { status: 'ok' };
  }
}
