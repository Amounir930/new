/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
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
  // S9: Prevent Webpack from bundling Node.js-only OpenTelemetry internals
  // that use dynamic require() — avoids Critical dependency warnings in build.
  serverExternalPackages: [
    '@opentelemetry/instrumentation',
    '@opentelemetry/instrumentation-undici',
    '@opentelemetry/instrumentation-winston',
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
    'require-in-the-middle',
  ],
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Protocol S11: Disable worker threads to resolve Bun "resourceLimits" incompatibility
    workerThreads: false,
    cpus: 1,
  },
  // Protocol S11: Parity for Next.js 16 + Turbopack
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.60sec.shop',
      },
      {
        protocol: 'https',
        hostname: '**.60sec.shop',
      },
    ],
  },
};

export default nextConfig;
