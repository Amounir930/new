import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption';

/**
 * S7: Security Module
 * Provides global encryption and security services.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class SecurityModule {}
