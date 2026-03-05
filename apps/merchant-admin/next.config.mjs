/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@apex/ui', '@apex/db', '@apex/provisioning', '@apex/config', '@apex/security'],
  output: 'standalone',
};

export default nextConfig;
