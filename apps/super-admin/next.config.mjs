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
  ],
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/super-admin',
        destination: '/dashboard',
        permanent: true,
      },
      // Ensure / redirects to /dashboard if logged in (middleware usually handles this, but redirect is safer)
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  experimental: {
    // Protocol S11: Disable worker threads to resolve Bun "resourceLimits" incompatibility
    workerThreads: false,
    cpus: 1,
  },
  turbopack: {},
};

export default nextConfig;
