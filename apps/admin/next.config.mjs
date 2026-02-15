/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@apex/ui", "@apex/db"],
    output: "standalone",
};

export default nextConfig;
