import { ConfigModule } from '@apex/config';
import { Global, Module } from '@nestjs/common';
import { SecurityService } from './security.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SecurityService,
    { provide: 'SECURITY_SERVICE', useExisting: SecurityService },
  ],
  exports: [SecurityService, 'SECURITY_SERVICE'],
})
export class SecurityModule {}
