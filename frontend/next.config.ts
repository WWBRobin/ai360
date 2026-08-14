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
  // 静态资源长缓存：/_next/static/ 文件名带内容哈希，可安全缓存一年且 immutable。
  // 注意：仅针对静态资源，HTML 不加长缓存（保持每次请求校验新鲜度）。
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
