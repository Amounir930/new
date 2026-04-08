import { ConfigModule, ConfigService } from '@apex/config/service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { GoogleCustomerStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') as string,
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CustomerAuthService, CustomerJwtStrategy, GoogleCustomerStrategy],
  exports: [CustomerAuthService, CustomerJwtStrategy],
})
export class CustomerAuthModule {}
