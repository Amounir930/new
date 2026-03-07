import { ConfigModule } from '@apex/config';
import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption';

/**
 * S7: Security Module
 * Provides global encryption and security services.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class SecurityModule {}
