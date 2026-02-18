import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      message: 'Apex v2 API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('robots.txt')
  robots() {
    return `User-agent: *
Disallow: /
# S11: Bot Defense Active
User-agent: GPTBot
Disallow: /`;
  }
}
