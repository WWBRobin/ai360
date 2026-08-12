import type { MetadataRoute } from 'next'

// 站点根域名。生产部署到 vokki.cn；可用 NEXT_PUBLIC_SITE_URL 覆盖。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vokki.cn'

/**
 * robots.txt 生成器（Next.js 16 Metadata Route）
 *
 * - 允许所有爬虫抓取全站
 * - 仅屏蔽搜索结果页（低价值、易产生重复内容）
 * - 指向 sitemap.xml，帮助搜索引擎发现新页面
 *
 * 输出: https://vokki.cn/robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/search'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
