import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { domains: [] },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/app/dashboard', permanent: true },
      {
        source: '/accounts/:path*',
        destination: '/app/accounts/:path*',
        permanent: true,
      },
      {
        source: '/transactions/:path*',
        destination: '/app/transactions/:path*',
        permanent: true,
      },
      {
        source: '/credit-cards/:path*',
        destination: '/app/credit-cards/:path*',
        permanent: true,
      },
      { source: '/budgets', destination: '/app/budgets', permanent: true },
      {
        source: '/goals/:path*',
        destination: '/app/goals/:path*',
        permanent: true,
      },
      {
        source: '/loans/:path*',
        destination: '/app/loans/:path*',
        permanent: true,
      },
      {
        source: '/investments/:path*',
        destination: '/app/investments/:path*',
        permanent: true,
      },
      {
        source: '/recurring/:path*',
        destination: '/app/recurring/:path*',
        permanent: true,
      },
      {
        source: '/documents/:path*',
        destination: '/app/documents/:path*',
        permanent: true,
      },
      { source: '/analytics', destination: '/app/analytics', permanent: true },
      { source: '/settings', destination: '/app/settings', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
