import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontService } from './storefront.service.js';

@Module({
  controllers: [],
  providers: [StorefrontService],
})
export class StorefrontModule { }
