import { ConfigService } from '@apex/config';
import { Public } from '@apex/auth';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { createClient } from 'redis';

/**
 * Health Controller
 * S6: Active connectivity checks for security-critical services
 */
@Controller({ path: 'health', version: [VERSION_NEUTRAL, '1'] })
@Public()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly config: ConfigService) { }

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
    const redisUrl = this.config.get('REDIS_URL');
    const client = createClient({ url: redisUrl });

    try {
      await client.connect();
      await client.ping();
      await client.disconnect();

      return {
        status: 'ok',
        service: 'redis',
        message: 'Redis connectivity verified',
      };
    } catch (error) {
      // 🛡️ S5: Sanitize error message to prevent infrastructure info disclosure
      this.logger.error(
        `Redis connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      return {
        status: 'error',
        service: 'redis',
        message: 'Internal server error during connectivity check',
      };
    }
  }

  @Get('liveness')
  checkLiveness() {
    return { status: 'ok' };
  }

  @Get('status')
  checkStatus() {
    return { status: 'ok', environment: this.config.get('NODE_ENV') };
  }
}
