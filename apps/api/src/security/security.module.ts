import { ConfigModule } from '@apex/config';
import { Global, Module } from '@nestjs/common';
import { RateLimitModule } from '@apex/middleware';
import { SecurityService } from './security.service';
import { CloudflareService } from './cloudflare.service';
import { ActiveDefenseService } from './active-defense.service';

@Global()
@Module({
  imports: [ConfigModule, RateLimitModule],
  providers: [
    SecurityService,
    CloudflareService,
    ActiveDefenseService,
    { provide: 'SECURITY_SERVICE', useExisting: SecurityService },
    { provide: 'ACTIVE_DEFENSE_SERVICE', useExisting: ActiveDefenseService },
  ],
  exports: [
    SecurityService,
    CloudflareService,
    ActiveDefenseService,
    'SECURITY_SERVICE',
    'ACTIVE_DEFENSE_SERVICE',
  ],
})
export class SecurityModule {}
