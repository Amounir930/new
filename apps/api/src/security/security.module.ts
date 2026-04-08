import { ConfigModule } from '@apex/config/service';
import { Global, Module } from '@nestjs/common';
import { ActiveDefenseService } from './active-defense.service';
import { CloudflareService } from './cloudflare.service';
import { SecurityService } from './security.service';

@Global()
@Module({
  imports: [ConfigModule],
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
export class LocalSecurityModule {}
