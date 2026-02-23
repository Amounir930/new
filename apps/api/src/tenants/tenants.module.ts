import { DbModule } from '@apex/db';
import { Module } from '@nestjs/common';
import { TenantsPublicController } from './tenants-public.controller.js';
import { TenantsController } from './tenants.controller.js';
import { SecurityService } from '../security/security.service.js';

@Module({
  imports: [],
  controllers: [TenantsController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class TenantsModule { }
