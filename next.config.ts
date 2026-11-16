import type { NextConfig } from 'next';

const securityHeaders = [
  // Cloudflare sets the same header for the whole aki.sh zone (includeSubDomains);
  // this copy matters only when the site is reached without Cloudflare.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
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
