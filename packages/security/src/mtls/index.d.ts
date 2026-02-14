/**
 * P1: mTLS (Mutual TLS) Implementation
 * Purpose: Secure inter-service communication with mutual authentication
 */
import { createServer, type Server, type ServerOptions } from 'node:https';
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
export declare function loadCertificates(config: Pick<MTLSConfig, 'caCertPath' | 'certPath' | 'keyPath'>): {
    ca: NonSharedBuffer;
    cert: NonSharedBuffer;
    key: NonSharedBuffer;
};
/**
 * Create mTLS server options
 */
export declare function createMTLSServerOptions(config: MTLSConfig): ServerOptions;
/**
 * mTLS Server Manager
 */
export declare class MTLSServer {
    private server?;
    private config;
    private expiryTimer?;
    constructor(config: MTLSConfig);
    /**
     * Start mTLS server
     */
    createServer(requestListener?: Parameters<typeof createServer>[1]): Server;
    /**
     * Check certificate expiry
     */
    private checkCertificateExpiry;
    /**
     * Start monitoring certificate expiry
     */
    private startExpiryMonitoring;
    /**
     * Stop the server
     */
    close(): void;
}
/**
 * Create mTLS client configuration for fetch/axios
 */
export declare function createMTLSClientConfig(config: MTLSClientConfig): {
    httpsAgent: {
        ca: NonSharedBuffer;
        cert: NonSharedBuffer;
        key: NonSharedBuffer;
        servername: string;
        rejectUnauthorized: boolean;
        minVersion: string;
    };
};
/**
 * Generate certificate paths based on environment
 */
export declare function getCertificatePaths(serviceName: string): Required<Pick<MTLSConfig, 'caCertPath' | 'certPath' | 'keyPath'>>;
/**
 * mTLS Middleware for Express/NestJS
 */
export declare function mtlsMiddleware(config: MTLSConfig): (req: any, res: any, next: any) => any;
declare const _default: {
    MTLSServer: typeof MTLSServer;
    loadCertificates: typeof loadCertificates;
    createMTLSServerOptions: typeof createMTLSServerOptions;
    createMTLSClientConfig: typeof createMTLSClientConfig;
    getCertificatePaths: typeof getCertificatePaths;
    mtlsMiddleware: typeof mtlsMiddleware;
};
export default _default;
//# sourceMappingURL=index.d.ts.map