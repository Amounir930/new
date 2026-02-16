import { Module } from '@nestjs/common';
import { AuthModule as PackageAuthModule } from '@apex/auth';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [PackageAuthModule],
  controllers: [AuthController],
})
export class AuthModule { }
