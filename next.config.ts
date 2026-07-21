if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto');
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mongoose"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "demoplace.my.id",
        "www.demoplace.my.id",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },
  // Enable Turbopack explicitly (Next.js 16 default) — empty config silences the webpack warning
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "demoplace.my.id",
        pathname: "/api/uploads/**",
      },
      {
        protocol: "http",
        hostname: "demoplace.my.id",
        pathname: "/api/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3001",
        pathname: "/api/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/api/uploads/**",
      },
    ],
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
