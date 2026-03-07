import { ConfigModule } from '@apex/config';
import { Global, Module } from '@nestjs/common';
import { SecurityService } from './security.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
