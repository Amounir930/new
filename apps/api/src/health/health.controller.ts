import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import type * as express from 'express';
import { createClient } from 'redis';

/**
 * Health Controller
 * S6: Active connectivity checks for security-critical services
 */
@Controller({ path: 'health', version: ['1', ''] })
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @Get('redis')
  async checkRedis(@Res() res: express.Response) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ url: redisUrl });

    try {
      await client.connect();
      await client.ping();
      await client.disconnect();

      return res.status(HttpStatus.OK).json({
        status: 'ok',
        service: 'redis',
        message: 'Redis connectivity verified',
      });
    } catch (error) {
      // 🛡️ S5: Sanitize error message to prevent infrastructure info disclosure
      // 🛡️ S5: Sanitize error message to prevent infrastructure info disclosure
      this.logger.error(
        `Redis connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        service: 'redis',
        message: 'Internal server error during connectivity check',
      });
    }
  }

  @Get('liveness')
  checkLiveness(@Res() res: express.Response) {
    return res.status(HttpStatus.OK).json({ status: 'ok' });
  }

  @Get('status')
  checkStatus(@Res() res: express.Response) {
    return res.status(HttpStatus.OK).json({ status: 'ok', environment: process.env.NODE_ENV });
  }
}
