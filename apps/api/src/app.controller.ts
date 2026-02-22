import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '@apex/auth';

@Controller()
@Public()
export class AppController {
  @Get()
  @Version(VERSION_NEUTRAL)
  root() {
    return {
      status: 'ok',
      message: 'Apex v2 API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/liveness')
  @Version(VERSION_NEUTRAL)
  checkLiveness() {
    return { status: 'ok' };
  }

  @Get('robots.txt')
  @Version(VERSION_NEUTRAL)
  @Public()
  robots() {
    return `User-agent: *
Disallow: /`;
  }
}
