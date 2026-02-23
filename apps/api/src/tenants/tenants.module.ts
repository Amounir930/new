import { DbModule } from '@apex/db';
import { Module } from '@nestjs/common';
import { TenantsPublicController } from './tenants-public.controller.js';
import { TenantsController } from './tenants.controller.js';
@Module({
  imports: [],
  controllers: [TenantsController, TenantsPublicController],
  providers: [],
})
export class TenantsModule { }
