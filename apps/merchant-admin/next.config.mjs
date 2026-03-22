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
  experimental: {
    // Protocol S11: Disable worker threads to resolve Bun "resourceLimits" incompatibility
    workerThreads: false,
    cpus: 1,
  },
  turbopack: {},
};

export default nextConfig;
