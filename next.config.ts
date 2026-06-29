import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    VITE_APPWRITE_ENDPOINT: process.env.VITE_APPWRITE_ENDPOINT,
    VITE_APPWRITE_PROJECT_ID: process.env.VITE_APPWRITE_PROJECT_ID,
    VITE_CONTACT_EMAIL: process.env.VITE_CONTACT_EMAIL,
    VITE_TURNSTILE_SITE_KEY: process.env.VITE_TURNSTILE_SITE_KEY,
    VITE_WEB3FORMS_ACCESS_KEY: process.env.VITE_WEB3FORMS_ACCESS_KEY,
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
        destination: '/ja/admin',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
