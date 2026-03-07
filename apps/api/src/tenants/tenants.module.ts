import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsPublicController } from './tenants-public.controller';
@Module({
  imports: [],
  controllers: [TenantsController, TenantsPublicController],
  providers: [],
})
export class TenantsModule {}
