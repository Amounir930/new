import { AuditModule } from '@apex/audit';
import { CustomerAuthService, CustomerJwtStrategy } from '@apex/auth';
import { ConfigModule, ConfigService } from '@apex/config/service';
import { TenantCacheModule } from '@apex/middleware';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CustomerAuthController } from './customer-auth.controller';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [
    AuditModule,
    TenantCacheModule, // provides TENANT_CACHE_SERVICE globally
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [StorefrontController, CustomerAuthController],
  providers: [
    StorefrontService,
    {
      provide: 'STOREFRONT_SERVICE',
      useExisting: StorefrontService,
    },
    CustomerAuthService,
    CustomerJwtStrategy,
  ],
  exports: [StorefrontService, 'STOREFRONT_SERVICE', CustomerAuthService],
})
export class StorefrontModule { }
