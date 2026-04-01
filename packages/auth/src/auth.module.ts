import { ConfigModule, ConfigService } from '@apex/config/service';
import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule, // Explicitly import for reliability
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get('JWT_SECRET') as string,
        signOptions: {
          expiresIn: configService.getWithDefault(
            'JWT_EXPIRES_IN',
            '7d'
          ) as '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
