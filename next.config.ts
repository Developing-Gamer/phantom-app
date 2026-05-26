import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: false, // Disable to prevent double OAuth callbacks in dev
  experimental: {
    ppr: false,
  },
  allowedDevOrigins: [
    "localhost",
    "*.localhost",
    "**.preview.localhost",
    "**.preview.lvh.me",
    "**.preview.tryphantom.io",
    "**.modal.host",
    "tryphantom.io",
    "www.tryphantom.io",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
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
