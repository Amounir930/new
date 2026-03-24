const jwt = require('jsonwebtoken');

const SECRET = 'ApexV2@Jwt-Secure#2026!Growth_Scale_QazXsw'; // Found in docker config

const payload = {
  sub: 'aba92941-135b-4ca8-9647-acb2b9dee4c6',
  email: 'Adel@60sec.shop',
  tenantId: '88a0495b-e1dc-464d-bf80-0a0d32d07f37',
  subdomain: 'adel21', // CRITICAL: Added for Lean Fix verification
  role: 'tenant_admin',
  jti: 'test-session-' + Date.now()
};

const token = jwt.sign(payload, SECRET, { expiresIn: '1d' });
console.log(token);
