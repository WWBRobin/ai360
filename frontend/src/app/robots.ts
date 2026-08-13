import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.vokki.cn'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 显式允许 AI 搜索引擎爬虫
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
      // 其他所有爬虫
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/search', '/admin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
