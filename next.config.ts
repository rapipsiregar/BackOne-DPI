import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["dev.demoplace.my.id", "www.dev.demoplace.my.id"],
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3011'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
