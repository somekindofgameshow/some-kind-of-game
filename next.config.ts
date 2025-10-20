// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⬇️ This skips ESLint during Vercel builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["img.youtube.com", "i.ytimg.com"],
  },
};

export default nextConfig;
