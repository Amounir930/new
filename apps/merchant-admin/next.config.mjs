import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@apex/ui',
    '@apex/db',
    '@apex/provisioning',
    '@apex/config',
    '@apex/security',
    '@apex/validation',
    '@apex/validators',
    '@apex/middleware',
    '@apex/audit',
    '@apex/auth',
    '@apex/events',
    '@apex/export',
    '@apex/media',
    '@apex/monitoring',
    '@apex/test-utils',
  ],
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.60sec.shop',
      },
    ],
  },
  experimental: {
    // Protocol S11: Disable worker threads to resolve Bun "resourceLimits" incompatibility
    workerThreads: false,
    cpus: 1,
  },
  turbopack: {},
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  // S9: Prevent Webpack from bundling Node.js-only OpenTelemetry internals
  serverExternalPackages: [
    '@opentelemetry/instrumentation',
    '@opentelemetry/instrumentation-undici',
    '@opentelemetry/instrumentation-winston',
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
    'require-in-the-middle',
  ],
  webpack(config) {
    // Explicit resolution for exports-map subpath @apex/config/edge
    // required because some Webpack versions don't read package.json exports map
    // from symlinked workspace packages.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@apex/config/edge': require.resolve('../../packages/config/dist/edge.js'),
    };
    return config;
  },
};

export default nextConfig;
