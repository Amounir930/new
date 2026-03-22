const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self' localhost:*",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.60sec.shop localhost:*",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.60sec.shop localhost:*",
      "img-src 'self' data: https: https://*.60sec.shop localhost:*",
      "font-src 'self' data: https://fonts.gstatic.com https://*.60sec.shop localhost:*",
      "connect-src 'self' https://*.60sec.shop http://localhost:*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

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
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Protocol S11: Disable worker threads to resolve Bun "resourceLimits" incompatibility
    workerThreads: false,
    cpus: 1,
  },
  // Protocol S11: Parity for Next.js 16 + Turbopack
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
