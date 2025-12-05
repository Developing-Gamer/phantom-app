import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: false, // Disable to prevent double OAuth callbacks in dev
  experimental: {
    // Disable PPR to ensure middleware runs in Node.js runtime (not Edge)
    // This allows Prisma to work in middleware
    ppr: false,
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "https://*.tryphantom.io",
    "http://www.tryphantom.io",
    "http://tryphantom.io",
  ],
  images: {
    remotePatterns: [
      {
        // Allows images from Pexels
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        // Allows videos from Pexels
        protocol: "https",
        hostname: "static-videos.pexels.com",
      },
    ],
  },
};

export default nextConfig;
