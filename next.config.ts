import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ja',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/ja/admin',
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
