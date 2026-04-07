import jwt from 'jsonwebtoken';
import { SYSTEM_TENANT_ID } from '@apex/db';

const token = jwt.sign(
  {
    sub: 'super-admin-id',
    email: 'admin@60sec.shop',
    role: 'super_admin',
    tenantId: SYSTEM_TENANT_ID,
  },
  'apex-super-secret-jwt-key-2026-production',
  { expiresIn: '1h' }
);
console.log(token);
