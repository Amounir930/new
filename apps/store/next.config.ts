/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // S8: Enhanced security headers can be added here if needed
    poweredByHeader: false,
    reactStrictMode: true,
};

export default nextConfig;
