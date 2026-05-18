import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Cloudinary image delivery
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Suppress Prisma edge runtime warning — we use nodejs runtime in API routes
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
