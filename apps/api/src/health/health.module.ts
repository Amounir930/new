import { ConfigModule } from '@apex/config';
import { RateLimitModule } from '@apex/middleware';
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule,
    RateLimitModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
