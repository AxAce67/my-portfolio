import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ja',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/ja/admin/projects',
        permanent: false,
      },
      {
        // The dashboard opens on its first tab.
        source: '/:locale/admin',
        destination: '/:locale/admin/projects',
        permanent: false,
      },
      {
        source: '/radar',
        destination: '/ja/radar',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
