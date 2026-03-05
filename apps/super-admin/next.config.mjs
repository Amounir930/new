/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@apex/ui', '@apex/db', '@apex/provisioning', '@apex/config', '@apex/security'],
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/super-admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
