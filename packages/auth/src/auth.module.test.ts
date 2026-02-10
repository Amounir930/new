/**
 * Auth Module Tests
 */

import { ConfigModule, ConfigService } from '@apex/config';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';

describe('AuthModule', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, ConfigModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: vi.fn().mockImplementation((key) => {
          if (key === 'JWT_SECRET')
            return 'super-secret-key-at-least-32-chars-long';
          return null;
        }),
        getWithDefault: vi.fn().mockReturnValue('7d'),
      })
      .compile();

    const authModule = module.get<AuthModule>(AuthModule);
    const authService = module.get<AuthService>(AuthService);

    expect(authModule).toBeDefined();
    expect(authService).toBeDefined();
  });

  it('should configure JwtModule correctly', async () => {
    const mockConfigService = {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'secret';
        return null;
      }),
      getWithDefault: vi.fn().mockReturnValue('1d'),
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
