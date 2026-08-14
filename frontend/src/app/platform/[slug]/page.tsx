import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getSkillsByPlatform,
  getSkillsCountByPlatform,
  getPlatforms,
  getScenarios,
} from '@/lib/supabase'
import SkillCardProto7 from '@/components/SkillCardProto7'
import AppSidebar from '@/components/AppSidebar'
import ScenarioTabs from '@/components/ScenarioTabs'
import SubTags from '@/components/SubTags'
import FilterBar from '@/components/FilterBar'
import Pagination from '@/components/Pagination'
import type { SkillCard, Platform } from '@/types'

const PAGE_SIZE = 24

export const revalidate = 600

type SortKey = 'recommended' | 'latest' | 'rating'

function sortSkills(skills: SkillCard[], sort: SortKey): SkillCard[] {
  const sorted = [...skills]
  switch (sort) {
    case 'latest':
      return sorted.sort((a, b) => {
        if (!a.evaluated_at) return 1
        if (!b.evaluated_at) return -1
        return b.evaluated_at.localeCompare(a.evaluated_at)
      })
    case 'rating':
      return sorted.sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
    case 'recommended':
    default:
      return sorted.sort((a, b) => {
        const sa = a.overall_score ?? 0
        const sb = b.overall_score ?? 0
        if (sb !== sa) return sb - sa
        if (!a.evaluated_at) return 1
        if (!b.evaluated_at) return -1
        return b.evaluated_at.localeCompare(a.evaluated_at)
      })
  }
}

export async function generateStaticParams() {
  const platforms = await getPlatforms()
  return platforms.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const platforms = await getPlatforms()
  const platform = platforms.find((p) => p.slug === slug)
  const name = platform?.name || slug

  const title = `${name} 上的 Skill 评测`
  const description = `${name}平台上最好用的 AI Skill 推荐，独立第三方评测，含上手难度、稳定性与免费额度。`

  return {
    title,
    description,
    alternates: { canonical: `/platform/${slug}` },
    openGraph: { title: `${title} · AI360`, description, type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} · AI360`, description },
  }
}

export default async function PlatformPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const sort = (typeof sp.sort === 'string' ? sp.sort : 'recommended') as SortKey
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1)

  const [totalCount, currentPageSkills, platforms, scenarios] = await Promise.all([
    getSkillsCountByPlatform(slug),
    getSkillsByPlatform(slug, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    getPlatforms(),
    getScenarios().catch(() => []),
  ])
  const platform = platforms.find((p) => p.slug === slug)

  if (!platform) {
    return (
      <div className="page-wrapper flex min-h-screen relative">
        <AppSidebar />
        <main className="flex-1 min-w-0 relative z-10 px-8 py-20 text-center text-[var(--fg3)]">
          平台不存在
        </main>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const skills = sortSkills(currentPageSkills, sort)

  // 整体平均分（基于当前页数据的已评测项）
  const evaluatedOnPage = currentPageSkills.filter((s) => s.overall_score != null)
  const avgScore =
    evaluatedOnPage.length > 0
      ? evaluatedOnPage.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / evaluatedOnPage.length
      : null
  const testedCount = evaluatedOnPage.length

  const paginationParams: Record<string, string | undefined> = {
    sort: typeof sp.sort === 'string' ? sp.sort : undefined,
  }

  // 场景 Tab + 二级标签数据（P1-1: 过滤掉 skill_count<=0 的空分类，避免渲染空壳）
  const sceneTabs = scenarios.length > 0
    ? scenarios
        .map((s) => ({ slug: s.slug, name: s.name, count: s.skill_count ?? 0 }))
        .filter((s) => s.count > 0)
    : []
  const subTags = [
    { id: 'all', icon: '★', label: '全部', count: totalCount },
    ...scenarios
      .slice(0, 8)
      .map((s) => ({ id: s.slug, icon: '◆', label: s.name, count: s.skill_count ?? 0 }))
      .filter((t) => t.count > 0),
  ]

  return (
    <div className="page-wrapper flex min-h-screen relative">
      <AppSidebar />

      <main className="flex-1 min-w-0 relative z-10 px-8 py-10 max-w-[1080px]">
        {/* 面包屑 */}
        <nav className="text-[12px] text-[var(--fg3)] mb-4">
          <Link href="/" className="hover:text-[var(--primary)]">首页</Link>
          <span> / </span>
          <span className="text-[var(--fg2)]">{platform.name}</span>
        </nav>

        {/* 最后更新时间 */}
        <p className="text-xs text-[var(--fg3)] mb-3">
          最后更新：<time className="text-[var(--fg2)] font-medium">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        </p>

        {/* 平台 Hero 区（content-card） */}
        <PlatformHero platform={platform} totalCount={totalCount} avgScore={avgScore} testedCount={testedCount} />

        {/* 双行 Tab：场景 7 + 类型 4 */}
        {sceneTabs.length > 0 && <ScenarioTabs scenes={sceneTabs} activeScene="" />}

        {/* 二级横排标签（场景维度筛选） */}
        <SubTags tags={subTags} />

        {/* 排序栏（P1-2: total 用收录总数 totalCount，testedCount 为实测数，统一口径避免矛盾） */}
        <FilterBar total={totalCount} testedCount={testedCount} showPlatformFilter={false} />

        {/* Skill 卡片网格（双列） */}
        {skills.length > 0 ? (
          <>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {skills.map((skill) => (
                <SkillCardProto7 key={skill.id} skill={skill} />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath={`/platform/${slug}`}
              searchParams={paginationParams}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-[var(--fg3)]">该平台暂无已评测 Skill</p>
            <p className="text-[var(--fg3)] text-sm mt-2">我们正在持续收录中</p>
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * 平台 Hero 区组件（content-card）
 * 对齐 proto7-platform.html 的 .hero：大 Logo + H1 + 描述 + 整体评分徽章 + stats
 */
function PlatformHero({
  platform,
  totalCount,
  avgScore,
  testedCount,
}: {
  platform: Platform
  totalCount: number
  avgScore: number | null
  testedCount: number
}) {
  return (
    <div className="content-card p-7 mb-6 flex items-start gap-5 flex-wrap">
      {/* 大 Logo 占位 */}
      <div
        className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center text-[34px] font-extrabold text-white shrink-0"
        style={{
          background: 'var(--primary)',
        }}
      >
        {platform.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-[26px] font-bold text-[var(--fg)] mb-1.5" style={{ letterSpacing: '-0.5px' }}>
          {platform.name}
        </h1>
        {platform.description && (
          <p className="text-[15px] font-semibold text-[var(--primary)] mb-2">{platform.description}</p>
        )}
        <p className="text-[14px] text-[var(--fg2)] max-w-[680px] mb-3 leading-[1.7]">
          {platform.name}平台共 {totalCount} 个工具与技能，覆盖编程、写作、研究、运维全场景。
        </p>

        {/* 链接 */}
        <div className="flex gap-2.5 flex-wrap items-center mb-3">
          {platform.base_url && (
            <a
              href={platform.base_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--sidebar)] text-[12px] text-[var(--fg2)] transition hover:bg-[var(--border)] hover:text-[var(--fg)]"
            >
              官网 ↗
            </a>
          )}
          {platform.api_supported && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--sidebar)] text-[12px] text-[var(--fg2)]">
              支持 API
            </span>
          )}
        </div>

        {/* stats */}
        <div className="flex gap-7 pt-3 border-t border-[var(--border)]">
          <Stat label="工具总数" value={String(totalCount)} />
          <Stat label="AI360 实测" value={String(testedCount)} />
          {avgScore != null && (
            <Stat label="平均得分" value={avgScore.toFixed(1)} highlight />
          )}
        </div>
      </div>

      {/* 整体评分徽章 */}
      {avgScore != null && (
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(var(--dim-rgb),0.06)] border border-[var(--border)]">
            <span className="text-[22px] font-extrabold text-[var(--primary)]">{avgScore.toFixed(1)}</span>
            <span className="text-[11px] text-[var(--fg3)] leading-[1.3]">
              整体
              <br />
              评分
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-[12px] text-[var(--fg3)]">
      <strong
        className={`text-[18px] font-bold block mb-0.5 ${highlight ? 'text-[var(--primary)]' : 'text-[var(--fg)]'}`}
      >
        {value}
      </strong>
      {label}
    </div>
  )
}
