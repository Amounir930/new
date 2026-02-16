import { Module } from '@nestjs/common';
import { AuthModule as PackageAuthModule } from '../../../../packages/auth/src/auth.module.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [PackageAuthModule],
  controllers: [AuthController],
})
export class AuthModule {}
