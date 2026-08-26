import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@makaan/shared'],
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/$/, '');
    if (!backendOrigin) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
