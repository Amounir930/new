/**
 * P1: mTLS (Mutual TLS) Implementation
 * Purpose: Secure inter-service communication with mutual authentication
 */

import { readFileSync } from 'node:fs';
import { type Server, type ServerOptions, createServer } from 'node:https';
import { join } from 'node:path';

export interface MTLSConfig {
  /** Path to CA certificate */
  caCertPath: string;
  /** Path to service certificate */
  certPath: string;
  /** Path to service private key */
  keyPath: string;
  /** Require client certificate verification */
  requestCert: boolean;
  /** Reject unauthorized clients */
  rejectUnauthorized: boolean;
  /** Allowed CNs (Common Names) for client certificates */
  allowedClients?: string[];
  /** Certificate expiry check interval (ms) */
  expiryCheckInterval?: number;
}

export interface MTLSClientConfig {
  /** Path to CA certificate */
  caCertPath: string;
  /** Path to client certificate */
  certPath: string;
  /** Path to client private key */
  keyPath: string;
  /** Server hostname verification */
  servername: string;
}

/**
 * Load certificates from filesystem
 */
export function loadCertificates(
  config: Pick<MTLSConfig, 'caCertPath' | 'certPath' | 'keyPath'>
) {
  try {
    return {
      ca: readFileSync(config.caCertPath),
      cert: readFileSync(config.certPath),
      key: readFileSync(config.keyPath),
    };
  } catch (error) {
    throw new Error(
      `Failed to load mTLS certificates: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

/**
 * Create mTLS server options
 */
export function createMTLSServerOptions(config: MTLSConfig): ServerOptions {
  const certs = loadCertificates(config);

  return {
    ca: certs.ca,
    cert: certs.cert,
    key: certs.key,
    requestCert: config.requestCert,
    rejectUnauthorized: config.rejectUnauthorized,
    // Enable only secure TLS versions
    minVersion: 'TLSv1.3',
    // Cipher suites
    ciphers:
      'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256',
  };
}

/**
 * mTLS Server Manager
 */
export class MTLSServer {
  private server?: Server;
  private config: MTLSConfig;
  private expiryTimer?: NodeJS.Timer;

  constructor(config: MTLSConfig) {
    this.config = {
      expiryCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };
  }

  /**
   * Start mTLS server
   */
  createServer(requestListener?: Parameters<typeof createServer>[1]): Server {
    const options = createMTLSServerOptions(this.config);

    this.server = createServer(options, (req, res) => {
      // Log client certificate info for audit
      const socket = req.socket as any;
      const cert = socket.getPeerCertificate?.();

      if (cert) {
        console.log(
          `[mTLS] Client connected: CN=${cert.subject?.CN}, serial=${cert.serialNumber}`
        );
      }

      if (requestListener) {
        requestListener(req, res);
      }
    });

    // Start certificate expiry monitoring
    this.startExpiryMonitoring();

    return this.server;
  }

  /**
   * Check certificate expiry
   */
  private checkCertificateExpiry(): void {
    try {
      const certs = loadCertificates(this.config);
      const cert = certs.cert.toString();

      // Extract expiry date from certificate
      const match = cert.match(/notAfter=(.+?)(?:\r?\n|$)/);
      if (match) {
        const expiryDate = new Date(match[1]);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30) {
          console.warn(
            `[mTLS] WARNING: Certificate expires in ${daysUntilExpiry} days!`
          );
        }

        if (daysUntilExpiry <= 7) {
          console.error(
            `[mTLS] CRITICAL: Certificate expires in ${daysUntilExpiry} days - RENEW NOW!`
          );
        }
      }
    } catch (error) {
      console.error('[mTLS] Failed to check certificate expiry:', error);
    }
  }

  /**
   * Start monitoring certificate expiry
   */
  private startExpiryMonitoring(): void {
    this.checkCertificateExpiry();
    this.expiryTimer = setInterval(
      () => this.checkCertificateExpiry(),
      this.config.expiryCheckInterval
    );
  }

  /**
   * Stop the server
   */
  close(): void {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer as NodeJS.Timeout);
    }
    this.server?.close();
  }
}

/**
 * Create mTLS client configuration for fetch/axios
 */
export function createMTLSClientConfig(config: MTLSClientConfig) {
  const certs = loadCertificates(config);

  return {
    httpsAgent: {
      ca: certs.ca,
      cert: certs.cert,
      key: certs.key,
      servername: config.servername,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.3',
    },
  };
}

/**
 * Generate certificate paths based on environment
 */
export function getCertificatePaths(
  serviceName: string
): Required<Pick<MTLSConfig, 'caCertPath' | 'certPath' | 'keyPath'>> {
  const basePath = process.env.MTLS_CERT_PATH || '/etc/mtls/certs';

  return {
    caCertPath: join(basePath, 'ca.crt'),
    certPath: join(basePath, `${serviceName}.crt`),
    keyPath: join(basePath, `${serviceName}.key`),
  };
}

/**
 * mTLS Middleware for Express/NestJS
 */
export function mtlsMiddleware(config: MTLSConfig) {
  return (req: any, res: any, next: any) => {
    const socket = req.socket as any;

    if (!socket.authorized) {
      return res.status(401).json({
        error: 'mTLS authentication required',
        code: 'MTLS_REQUIRED',
      });
    }

    const cert = socket.getPeerCertificate();

    // Validate client CN if whitelist specified
    if (config.allowedClients && config.allowedClients.length > 0) {
      const cn = cert.subject?.CN || cert.subject?.commonName;
      if (!config.allowedClients.includes(cn)) {
        return res.status(403).json({
          error: 'Client not authorized',
          code: 'MTLS_UNAUTHORIZED_CLIENT',
        });
      }
    }

    // Attach certificate info to request
    req.clientCertificate = {
      subject: cert.subject,
      issuer: cert.issuer,
      fingerprint: cert.fingerprint,
      serialNumber: cert.serialNumber,
      valid_from: cert.valid_from,
      valid_to: cert.valid_to,
    };

    next();
  };
}

export default {
  MTLSServer,
  loadCertificates,
  createMTLSServerOptions,
  createMTLSClientConfig,
  getCertificatePaths,
  mtlsMiddleware,
};
