import type { MetadataRoute } from 'next'
import { getFeaturedSkills, getPlatforms, getScenarios } from '@/lib/supabase'
import { getPublishedNewsSlugs } from '@/app/news/queries'

// 站点根域名。生产部署到 vokki.cn；可用 NEXT_PUBLIC_SITE_URL 覆盖。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.vokki.cn'

/**
 * sitemap.xml 生成器（Next.js 16 Metadata Route）
 *
 * 列出全站所有可索引页面：
 *   - 静态页：首页 / 装机必备
 *   - 场景页：/scenario/[slug]
 *   - 平台页：/platform/[slug]
 *   - Skill 详情页：/skill/[slug]
 *
 * 搜索页（/search）在 robots.ts 中被 disallow，故不收录。
 *
 * 输出: https://vokki.cn/sitemap.xml
 *
 * 数据库不可用时优雅降级——只返回静态页，构建不会失败。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 静态页面
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/essential`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // 并行拉取动态数据；任一失败返回空，不影响其余页面
  const [skills, platforms, scenarios, newsSlugs] = await Promise.all([
    getFeaturedSkills(1000).catch(() => []),
    getPlatforms().catch(() => []),
    getScenarios().catch(() => []),
    getPublishedNewsSlugs().catch(() => []),
  ])

  // Skill 详情页
  const skillEntries: MetadataRoute.Sitemap = skills
    .filter((s) => s.slug)
    .map((s) => ({
      url: `${SITE_URL}/skill/${s.slug}`,
      lastModified: s.evaluated_at ? new Date(s.evaluated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // 场景页
  const scenarioEntries: MetadataRoute.Sitemap = scenarios
    .filter((s) => s.slug)
    .map((s) => ({
      url: `${SITE_URL}/scenario/${s.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // 平台页
  const platformEntries: MetadataRoute.Sitemap = platforms
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/platform/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  // 新闻详情页（content pipeline 已发布的资讯）
  const newsEntries: MetadataRoute.Sitemap = newsSlugs
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${SITE_URL}/news/${n.slug}`,
      lastModified: n.published_at ? new Date(n.published_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [...staticEntries, ...skillEntries, ...scenarioEntries, ...platformEntries, ...newsEntries]
}
