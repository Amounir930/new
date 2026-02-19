import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../packages/auth/src/index';
import {
  GovernanceGuard,
  RequireFeature,
} from '../../../../packages/middleware/src/governance.guard';
import {
  CheckQuota,
  QuotaInterceptor,
} from '../../../../packages/middleware/src/quota.interceptor';

@Controller('products')
@UseGuards(JwtAuthGuard, GovernanceGuard)
@UseInterceptors(QuotaInterceptor)
export class ProductsController {
  @Post()
  @RequireFeature('ecommerce')
  @CheckQuota('products')
  create() {
    return { success: true, message: 'Product created successfully' };
  }
}
