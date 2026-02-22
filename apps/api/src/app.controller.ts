import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '@apex/auth';

@Controller()
@Public()
export class AppController {
  @Get()
  @Version(VERSION_NEUTRAL)
  root() {
    return {
      message: 'Apex v2 API is running',
      version: '1.0.0',
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
Disallow: /
# S11: Bot Defense Active
User-agent: GPTBot
Disallow: /`;
  }
}
