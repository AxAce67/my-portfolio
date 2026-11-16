import type { NextConfig } from 'next';

const securityHeaders = [
  // Cloudflare sets the same header for the whole aki.sh zone (includeSubDomains);
  // this copy matters only when the site is reached without Cloudflare.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Report-only for now (2026-11-17): watch for violations before enforcing.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://analytics.aki.sh https://adring.net https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://appwrite.aki.sh https://count.getloli.com https://github.com https://*.githubusercontent.com https://ar-cdn.net https://*.ar-cdn.net",
      "font-src 'self' data:",
      "connect-src 'self' https://appwrite.aki.sh wss://appwrite.aki.sh https://analytics.aki.sh https://ntp-jp.aki.sh https://ar-cdn.net https://cloudflareinsights.com",
      "frame-src https://challenges.cloudflare.com https://tar1090.aki.sh",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'report-uri /api/csp-report',
    ].join('; '),
  },
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
