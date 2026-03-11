import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    sub: 'super-admin-id',
    email: 'admin@60sec.shop',
    role: 'super_admin',
    tenantId: 'system',
  },
  'apex-super-secret-jwt-key-2026-production',
  { expiresIn: '1h' }
);
console.log(token);
