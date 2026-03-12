import { AuthModule as PackageAuthModule } from '@apex/auth';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';

@Module({
  imports: [PackageAuthModule],
  controllers: [AuthController],
  exports: [PackageAuthModule],
})
export class AuthModule {}
