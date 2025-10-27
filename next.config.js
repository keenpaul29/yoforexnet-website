/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables for client and server
  env: {
    EXPRESS_URL: process.env.EXPRESS_URL || 'http://localhost:3001',
    NEXT_PUBLIC_EXPRESS_URL: process.env.EXPRESS_URL || 'http://localhost:3001',
  },

  // Server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:5000', 'localhost:3001'],
    },
  },

  // Proxy API requests to Express server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Redirects for old routes (if needed)
  async redirects() {
    return [];
  },
};

export default nextConfig;
