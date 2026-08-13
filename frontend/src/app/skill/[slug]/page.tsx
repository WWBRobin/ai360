import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { SkillDetail, AlternativeSkill, SkillCard, CompareRow } from '@/types'
import {
  getSkillDetail,
  getSkillsByScenario,
  getSkillCardsBySlugs,
  scoreToStars,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/lib/supabase'
import { getGitHubRepoData, type GitHubRepoData } from '@/lib/github'
import { getRelatedArticles } from '@/lib/related-articles'
import type { ArticleMeta } from '@/lib/articles'
import SkillDetailTabs from '@/components/SkillDetailTabs'
import AppSidebar from '@/components/AppSidebar'

// ISR：详情页每 1 小时增量静态重新生成
export const revalidate = 3600

// ===== 元数据 =====

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const skill = await getSkillDetail(slug)

  if (!skill) {
    return { title: '未找到该 Skill' }
  }

  const title = `${skill.name} — 评测 / 试用 / 安装`
  const description =
    skill.tagline ||
    `${skill.name}：5 维度评测（场景/上手/稳定/免费额度/Token 成本），含同类对比与在线试用。`

  return {
    title,
    description,
    keywords: [
      skill.name,
      skill.platform_name,
      'AI Skill 评测',
      'AI 工具推荐',
      CATEGORY_LABELS[skill.category] || skill.category,
    ],
    alternates: {
      canonical: `/skill/${skill.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      ...(skill.icon_url ? { images: [skill.icon_url] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ===== 预生成静态参数（构建时预渲染已发布的 Skill；失败返回空数组，运行时按需渲染）=====

export async function generateStaticParams() {
  try {
    const skills = await getSkillsByScenario('').catch(() => [])
    const slugs = new Set<string>()
    skills.forEach((s) => s.slug && slugs.add(s.slug))
    if (slugs.size === 0) {
      const featured = await import('@/lib/supabase').then((m) =>
        m.getFeaturedSkills(50)
      )
      featured.forEach((s) => s.slug && slugs.add(s.slug))
    }
    return Array.from(slugs).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

// ===== 页面主体 =====

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skill = await getSkillDetail(slug)

  if (!skill) {
    notFound()
  }

  const alternatives: AlternativeSkill[] = skill.alternatives || []
  const related = await getRelatedSkills(skill).catch(() => [])

  // GitHub 仓库数据（从 install_url 解析，失败静默降级）
  const github = await getGitHubRepoData(skill.install_url).catch(() => null)

  // 相关文章
  const relatedArticles = getRelatedArticles(
    {
      name: skill.name,
      slug: skill.slug,
      category: skill.category,
      platform_name: skill.platform_name,
      platform_slug: skill.platform_slug,
      scenario_slugs: skill.scenario_slugs || [],
      tagline: skill.tagline,
      description: skill.description,
    },
    4
  )

  // 构建同类对比表
  const altSlugs = alternatives.map((a) => a.slug).filter(Boolean)
  const altCards = altSlugs.length
    ? await getSkillCardsBySlugs(altSlugs).catch(() => [])
    : []
  const altBySlug = new Map(altCards.map((c) => [c.slug, c]))

  const currentRow: CompareRow = {
    slug: skill.slug,
    name: skill.name,
    platform_name: skill.platform_name,
    overall_score: skill.overall_score,
    difficulty_score: skill.difficulty_score,
    stability_score: skill.stability_score,
    free_quota: skill.free_quota,
    icon_url: skill.icon_url,
    category: skill.category,
    tagline: skill.tagline,
    is_current: true,
  }
  const altRows: CompareRow[] = alternatives
    .map((a) => {
      const card = altBySlug.get(a.slug)
      return {
        slug: a.slug,
        name: a.name,
        platform_name: a.platform_name || card?.platform_name || '',
        overall_score: a.overall_score ?? card?.overall_score ?? null,
        difficulty_score: card?.difficulty_score ?? null,
        stability_score: card?.stability_score ?? null,
        free_quota: card?.free_quota ?? null,
        icon_url: card?.icon_url ?? null,
        category: card?.category ?? skill.category,
        tagline: a.tagline ?? card?.tagline ?? null,
      } as CompareRow
    })
    .filter((r) => r.slug !== skill.slug)
    .sort((x, y) => (y.overall_score ?? -1) - (x.overall_score ?? -1))

  const compareRows: CompareRow[] = [currentRow, ...altRows]
  const hasEvaluated = skill.evaluated_at != null || skill.overall_score != null

  const evaluatedDate = skill.evaluated_at
    ? new Date(skill.evaluated_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  // 最后更新日期（YYYY-MM-DD，用于结构化数据与页面显示）
  const updatedDateISO = skill.evaluated_at ? skill.evaluated_at.slice(0, 10) : null
  const updatedDateDisplay = updatedDateISO || null

  const categoryLabel = CATEGORY_LABELS[skill.category] || skill.category

  // ===== JSON-LD：SoftwareApplication + AggregateRating =====
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: skill.name,
    description:
      skill.tagline ||
      skill.description ||
      `${skill.name}：${categoryLabel}类 AI 工具`,
    applicationCategory: categoryLabel,
    operatingSystem: 'Web',
    url: `https://tools.vokki.cn/skill/${skill.slug}`,
    ...(skill.icon_url ? { image: skill.icon_url } : {}),
    ...(skill.developer_name ? { author: { '@type': 'Organization', name: skill.developer_name } } : {}),
    ...(skill.platform_name ? { publisher: { '@type': 'Organization', name: skill.platform_name } } : {}),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
      description: skill.free_quota || '免费',
    },
    ...(skill.overall_score != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: skill.overall_score.toFixed(1),
            bestRating: '5',
            worstRating: '0',
            ratingCount: 1,
            reviewCount: 1,
          },
        }
      : {}),
  }

  // ===== JSON-LD：FAQPage（五问评测） =====
  const faqQuestions: { q: string; a: string }[] = [
    {
      q: `${skill.name} 是做什么的？什么场景用？`,
      a: skill.scenario_summary || `${skill.name} 是一款 ${categoryLabel}类 AI 工具，运行在 ${skill.platform_name} 平台上。`,
    },
    {
      q: `${skill.name} 上手多快？需要什么门槛？`,
      a:
        skill.difficulty_notes ||
        (skill.difficulty_score != null
          ? `上手难度评分 ${skill.difficulty_score}/5。`
          : `${skill.name} 上手门槛较低，无需复杂配置。`),
    },
    {
      q: `${skill.name} 稳定吗？限流严不严？`,
      a:
        skill.stability_notes ||
        (skill.stability_score != null
          ? `稳定性评分 ${skill.stability_score}/5。`
          : `${skill.name} 运行稳定，适合日常使用。`),
    },
    {
      q: `${skill.name} 免费额度够不够？真实成本多少？`,
      a: skill.free_quota || `${skill.name} 提供免费额度，可满足日常使用需求。`,
    },
    {
      q: `${skill.name} Token 消耗大吗？会拖慢 Agent 吗？`,
      a:
        skill.token_cost ||
        (skill.token_efficiency_score != null
          ? `Token 效率评分 ${skill.token_efficiency_score}/5。`
          : `${skill.name} Token 消耗合理，不影响 Agent 运行速度。`),
    },
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqQuestions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  // ===== JSON-LD：BreadcrumbList =====
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: 'https://tools.vokki.cn/' },
      ...(skill.platform_slug
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: skill.platform_name || categoryLabel,
              item: `https://tools.vokki.cn/platform/${skill.platform_slug}`,
            },
          ]
        : [{ '@type': 'ListItem', position: 2, name: categoryLabel, item: 'https://tools.vokki.cn/' }]),
      {
        '@type': 'ListItem',
        position: skill.platform_slug ? 3 : 2,
        name: skill.name,
        item: `https://tools.vokki.cn/skill/${skill.slug}`,
      },
    ],
  }

  return (
    <div className="page-wrapper flex min-h-screen relative">
      {/* SEO 结构化数据 JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <AppSidebar />

      <main className="flex-1 min-w-0 relative px-4 md:px-8 py-6 max-w-[1080px]">
      {/* 1. 面包屑 */}
      <nav className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mb-5 flex-wrap">
        <Link href="/" className="hover:text-[#FF8C00] transition">首页</Link>
        <span>/</span>
        {skill.platform_slug ? (
          <Link href={`/platform/${skill.platform_slug}`} className="hover:text-[#FF8C00] transition">
            {CATEGORY_LABELS[skill.category] || skill.platform_name || '场景'}
          </Link>
        ) : (
          <span>{CATEGORY_LABELS[skill.category] || '场景'}</span>
        )}
        <span>/</span>
        <span className="text-[#374151]">{skill.name}</span>
      </nav>

      {/* 最后更新日期（SEO+GEO，显示在页面头部） */}
      {updatedDateDisplay && (
        <p className="text-xs text-[#9CA3AF] mb-3">
          最后更新：<time dateTime={updatedDateISO || undefined} className="text-[#6B7280] font-medium">{updatedDateDisplay}</time>
        </p>
      )}

      {/* 60字结论段（SEO 摘要，tagline 作为结论） */}
      {skill.tagline && (
        <p className="text-[15px] text-[#374151] leading-[1.7] mb-5 font-medium">
          {skill.tagline}
        </p>
      )}

      {/* 2. Hero 工具头部 */}
      <div className="content-card p-6 md:p-8 mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* 左：标题+标签+评分+描述 */}
          <div className="flex-1 min-w-0">
            {/* 标题行：图标 + 名称 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#1f2937] flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
                {skill.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={skill.icon_url} alt={skill.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span>{skill.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h1 className="text-[22px] md:text-[26px] font-bold text-[#1A1A1A] leading-tight">
                {skill.name}
              </h1>
            </div>

            {/* 标签行 */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              <span className="tag tag-mcp">{skill.platform_name}</span>
              {hasEvaluated && <span className="tag tag-tested">AI360实测</span>}
              {skill.free_quota && <span className="tag tag-free">免费</span>}
              {skill.developer_name && skill.developer_name.toLowerCase() === skill.platform_name.toLowerCase() && (
                <span className="tag tag-official">Official</span>
              )}
            </div>

            {/* 评分行 */}
            {skill.overall_score != null && (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="text-[#FF8C00] tracking-wide">
                  {scoreToStars(skill.overall_score)}
                </span>
                <span className="font-bold text-[#6B7280]">{skill.overall_score.toFixed(1)}</span>
                <span className="text-xs text-[#9CA3AF]">/ 5.0</span>
                {evaluatedDate && (
                  <span className="text-xs text-[#9CA3AF]">· 评测于 {evaluatedDate}</span>
                )}
              </div>
            )}

            {/* 描述 */}
            <p className="text-[15px] text-[#6B7280] leading-[1.7]">
              {skill.tagline || skill.description || `${skill.name}：${CATEGORY_LABELS[skill.category] || ''}类工具`}
            </p>
          </div>

          {/* 右：操作按钮 */}
          <div className="flex flex-col gap-2.5 w-[180px] shrink-0">
            <a
              href={skill.install_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-5 py-3 text-center text-sm font-medium"
            >
              去安装 →
            </a>
            <Link href={`/compare?focus=${skill.slug}`} className="btn-outline px-5 py-2.5 text-center text-sm">
              对比
            </Link>
            {skill.trial_enabled && (
              <Link href={`#trial`} className="btn-outline px-5 py-2.5 text-center text-sm">
                试用
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tab 内容区（客户端组件） */}
      <SkillDetailTabs
        skill={skill}
        compareRows={compareRows}
        altRows={altRows}
        related={related}
        relatedArticles={relatedArticles}
        github={github}
        evaluatedDate={evaluatedDate}
      />
      </main>
    </div>
  )
}

// ===== 辅助：获取相关 Skill =====

async function getRelatedSkills(skill: SkillDetail): Promise<SkillCard[]> {
  const scenarioSlug = (skill as any).scenario_slugs?.[0] || ''
  if (scenarioSlug) {
    const byScenario = await getSkillsByScenario(scenarioSlug)
    const filtered = byScenario.filter((s) => s.slug !== skill.slug)
    if (filtered.length > 0) return filtered.slice(0, 6)
  }
  const alts = (skill.alternatives || []).filter((s) => s.slug !== skill.slug)
  if (alts.length > 0) {
    return alts.slice(0, 6).map((a) => ({
      id: a.skill_id,
      name: a.name,
      slug: a.slug,
      tagline: a.tagline,
      icon_url: null,
      category: 'scene' as const,
      platform_name: a.platform_name,
      platform_slug: '',
      api_supported: false,
      overall_score: a.overall_score,
      difficulty_score: null,
      stability_score: null,
      evaluated_at: null,
      free_quota: null,
      trial_enabled: false,
      install_url: '',
      scenario_slugs: [],
    }))
  }

  const { getFeaturedSkills } = await import('@/lib/supabase')
  const featured = await getFeaturedSkills(6)
  return featured.filter((s) => s.slug !== skill.slug).slice(0, 6)
}
