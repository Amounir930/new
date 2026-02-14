import { describe, expect, it, mock } from 'bun:test';
import { ConfigModule, ConfigService } from '@apex/config';
import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';

describe('AuthModule', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, ConfigModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: mock().mockImplementation((key) => {
          if (key === 'JWT_SECRET')
            return 'super-secret-key-at-least-32-chars-long';
          return null;
        }),
        getWithDefault: mock().mockReturnValue('7d'),
      })
      .compile();

    const authModule = module.get<AuthModule>(AuthModule);
    const authService = module.get<AuthService>(AuthService);

    expect(authModule).toBeDefined();
    expect(authService).toBeDefined();
  });

  it('should configure JwtModule correctly', async () => {
    const mockConfigService = {
      get: mock().mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'secret_at_least_32_chars_long_for_s1';
        return null;
      }),
      getWithDefault: mock().mockReturnValue('1d'),
    };

    const module = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });
});
