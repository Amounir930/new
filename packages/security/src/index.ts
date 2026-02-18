/**
 * @apex/security - Advanced Security Modules
 *
 * P1 Security Enhancements:
 * - mTLS (Mutual TLS) for inter-service communication
 * - Secrets Rotation with zero-downtime
 * - Penetration testing utilities
 */

// Encryption Module (S7)
export {
  decrypt,
  type EncryptedData,
  EncryptionService,
  encrypt,
  generateApiKey,
  hashApiKey,
  hashSensitiveData,
  maskSensitive,
} from './encryption.js';
// mTLS Module
export {
  createMTLSClientConfig,
  createMTLSServerOptions,
  getCertificatePaths,
  loadCertificates,
  type MTLSClientConfig,
  type MTLSConfig,
  MTLSServer,
  mtlsMiddleware,
} from './mtls/index.js';
// Secrets Module
export {
  generateSecret,
  hashSecret,
  type RotationListener,
  type SecretConfig,
  type SecretRotationEvent,
  SecretsManager,
  secretsManager,
  VaultIntegration,
  verifySecret,
} from './secrets/index.js';

export { SecurityModule } from './security.module.js';
