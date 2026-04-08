/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [
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
  experimental: {},
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
