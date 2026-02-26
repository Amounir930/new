import { DbModule } from '@apex/db';
import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller.js';
import { TenantsPublicController } from './tenants-public.controller.js';
@Module({
  imports: [],
  controllers: [TenantsController, TenantsPublicController],
  providers: [],
})
export class TenantsModule {}
