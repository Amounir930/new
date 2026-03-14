/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@apex/ui',
    '@apex/db',
    '@apex/provisioning',
    '@apex/config',
    '@apex/security',
  ],
  output: 'standalone',
  experimental: {
    // Protocol S11: Disable worker threads to resolve Bun "resourceLimits" incompatibility
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
