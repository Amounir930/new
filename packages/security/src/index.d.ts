/**
 * @apex/security - Advanced Security Modules
 *
 * P1 Security Enhancements:
 * - mTLS (Mutual TLS) for inter-service communication
 * - Secrets Rotation with zero-downtime
 * - Penetration testing utilities
 */
export { decrypt, type EncryptedData, EncryptionService, encrypt, generateApiKey, hashApiKey, hashSensitiveData, maskSensitive, } from './encryption.js';
export { createMTLSClientConfig, createMTLSServerOptions, getCertificatePaths, loadCertificates, type MTLSClientConfig, type MTLSConfig, MTLSServer, mtlsMiddleware, } from './mtls/index.js';
export { generateSecret, hashSecret, type RotationListener, type SecretConfig, type SecretRotationEvent, SecretsManager, secretsManager, VaultIntegration, verifySecret, } from './secrets/index.js';
//# sourceMappingURL=index.d.ts.map