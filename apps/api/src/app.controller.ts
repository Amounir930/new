import { Public } from '@apex/auth';
import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';

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

  @Get('test-error')
  @Version(VERSION_NEUTRAL)
  @Public()
  testError() {
    throw new Error('S5 Protocol Test Error: Forced 500');
  }
}
