import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // 解决 monorepo 警告
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
