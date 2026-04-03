import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const InitProvisioningRequestSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores.'),
  storeName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
  plan: z.enum(['free', 'pro']),
  category: z.string().min(1, 'Store category is required'),
  turnstileToken: z.string().min(1, 'Turnstile token is required'),
});

export class InitProvisioningRequestDto extends createZodDto(InitProvisioningRequestSchema) { }

export const VerifyProvisioningRequestSchema = z.object({
  requestId: z.string().uuid(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

export class VerifyProvisioningRequestDto extends createZodDto(VerifyProvisioningRequestSchema) { }
