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

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 relative z-10">
      {/* 1. 面包屑 */}
      <nav className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mb-5 flex-wrap">
        <Link href="/" className="hover:text-[#C99700] transition">首页</Link>
        <span>/</span>
        {skill.platform_slug ? (
          <Link href={`/platform/${skill.platform_slug}`} className="hover:text-[#C99700] transition">
            {CATEGORY_LABELS[skill.category] || skill.platform_name || '场景'}
          </Link>
        ) : (
          <span>{CATEGORY_LABELS[skill.category] || '场景'}</span>
        )}
        <span>/</span>
        <span className="text-[#374151]">{skill.name}</span>
      </nav>

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
                <span className="text-[#C99700] tracking-wide">
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
