/**
 * @apex/security - Advanced Security Modules
 *
 * P1 Security Enhancements:
 * - mTLS (Mutual TLS) for inter-service communication
 * - Secrets Rotation with zero-downtime
 * - Penetration testing utilities
 */
// Encryption Module (S7)
export { decrypt, EncryptionService, encrypt, generateApiKey, hashApiKey, hashSensitiveData, maskSensitive, } from './encryption.js';
// mTLS Module
export { createMTLSClientConfig, createMTLSServerOptions, getCertificatePaths, loadCertificates, MTLSServer, mtlsMiddleware, } from './mtls/index.js';
// Secrets Module
export { generateSecret, hashSecret, SecretsManager, secretsManager, VaultIntegration, verifySecret, } from './secrets/index.js';
//# sourceMappingURL=index.js.map