// 搜索结果页不缓存
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  searchSkills,
  getFeaturedSkills,
  getScenarios,
  getPlatforms,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  SCENARIO_ICONS,
} from '@/lib/supabase'
import SkillCardComponent from '@/components/SkillCard'
import type { SkillCard } from '@/types'

// 搜索结果页不索引（低价值、易产生重复内容）
export const metadata: Metadata = {
  title: '搜索',
  robots: {
    index: false,
    follow: false,
  },
}

type SortKey = 'recommended' | 'rating' | 'latest' | 'easiest'

// ===== 排序逻辑 =====
function sortSkills(skills: SkillCard[], sort: SortKey): SkillCard[] {
  const sorted = [...skills]
  switch (sort) {
    case 'rating':
      return sorted.sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
    case 'latest':
      return sorted.sort((a, b) => {
        if (!a.evaluated_at) return 1
        if (!b.evaluated_at) return -1
        return b.evaluated_at.localeCompare(a.evaluated_at)
      })
    case 'easiest':
      return sorted.sort((a, b) => (a.difficulty_score ?? 99) - (b.difficulty_score ?? 99))
    case 'recommended':
    default:
      return sorted.sort((a, b) => {
        const sa = a.overall_score ?? 0
        const sb = b.overall_score ?? 0
        if (sb !== sa) return sb - sa
        if (a.trial_enabled !== b.trial_enabled) return a.trial_enabled ? -1 : 1
        if (!a.evaluated_at) return 1
        if (!b.evaluated_at) return -1
        return b.evaluated_at.localeCompare(a.evaluated_at)
      })
  }
}

// ===== 多维筛选 =====
function applyFilters(
  skills: SkillCard[],
  filters: {
    category: string
    platform: string
    scenario: string
    rating: string
    trial: string
  }
): SkillCard[] {
  return skills.filter((s) => {
    if (filters.category !== 'all' && s.category !== filters.category) return false
    if (filters.platform !== 'all' && s.platform_slug !== filters.platform) return false
    if (filters.scenario !== 'all') {
      if (!s.scenario_slugs?.includes(filters.scenario)) return false
    }
    if (filters.rating !== 'all') {
      const minRating = parseFloat(filters.rating)
      if (!(s.overall_score && s.overall_score >= minRating)) return false
    }
    if (filters.trial === 'yes' && !s.trial_enabled) return false
    if (filters.trial === 'no' && s.trial_enabled) return false
    return true
  })
}

// 构建维度选项（基于搜索结果全集统计，不受筛选影响）
function buildFacets(skills: SkillCard[]) {
  const categoryMap = new Map<string, { name: string; count: number }>()
  const platformMap = new Map<string, { name: string; count: number }>()
  const scenarioMap = new Map<string, { name: string; count: number }>()
  let trialYes = 0
  let trialNo = 0

  for (const s of skills) {
    const cat = s.category || 'other'
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { name: CATEGORY_LABELS[cat] || cat, count: 0 })
    }
    categoryMap.get(cat)!.count++

    const pslug = s.platform_slug || 'unknown'
    if (!platformMap.has(pslug)) {
      platformMap.set(pslug, { name: s.platform_name || '其他', count: 0 })
    }
    platformMap.get(pslug)!.count++

    if (s.scenario_slugs && s.scenario_slugs.length > 0) {
      for (const sc of s.scenario_slugs) {
        if (!scenarioMap.has(sc)) {
          scenarioMap.set(sc, { name: sc, count: 0 })
        }
        scenarioMap.get(sc)!.count++
      }
    }

    if (s.trial_enabled) trialYes++
    else trialNo++
  }

  const sortDesc = (a: { count: number }, b: { count: number }) => b.count - a.count
  return {
    categories: [...categoryMap.entries()].map(([slug, v]) => ({ slug, name: v.name, count: v.count })).sort(sortDesc),
    platforms: [...platformMap.entries()].map(([slug, v]) => ({ slug, name: v.name, count: v.count })).sort(sortDesc),
    scenarios: [...scenarioMap.entries()].map(([slug, v]) => ({ slug, name: v.name, icon: SCENARIO_ICONS[slug] || '🎯', count: v.count })).sort(sortDesc),
    trialCounts: { yes: trialYes, no: trialNo },
  }
}

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  try {
  const sp = await searchParams
  const query = typeof sp.q === 'string' ? sp.q : ''
  const filters = {
    category: typeof sp.category === 'string' ? sp.category : 'all',
    platform: typeof sp.platform === 'string' ? sp.platform : 'all',
    scenario: typeof sp.scenario === 'string' ? sp.scenario : 'all',
    rating: typeof sp.rating === 'string' ? sp.rating : 'all',
    trial: typeof sp.trial === 'string' ? sp.trial : 'all',
  }
  const sort = (typeof sp.sort === 'string' ? sp.sort : 'recommended') as SortKey

  const allResults = query ? await searchSkills(query) : []
  const facets = buildFacets(allResults)
  const filtered = applyFilters(allResults, filters)
  const sorted = sortSkills(filtered, sort)

  const recommendations =
    allResults.length === 0 && query ? await getFeaturedSkills(6).catch(() => []) : []
  const scenarios = await getScenarios().catch(() => [])
  const platforms = await getPlatforms().catch(() => [])

  return (
    <div className="page-wrapper flex min-h-screen relative">
      <aside className="w-[220px] shrink-0 hidden lg:block sticky top-[108px] self-start"><div className="p-4 text-[13px] text-[#9CA3AF]">使用顶部筛选条件搜索</div></aside>

      <main className="flex-1 min-w-0 relative z-10">
        {/* 页头：搜索结果标题 */}
        <div className="px-8 pt-8 pb-2">
          <h1 className="text-[26px] font-bold text-[#1A1A1A] leading-tight mb-1" style={{ letterSpacing: '-0.4px' }}>
            搜索结果:{' '}
            {query ? (
              <span className="text-[#FF8C00]">{query}</span>
            ) : (
              'AI Skill'
            )}
          </h1>
          <p className="text-[14px] text-[#888]">
            {query ? `在全部工具中搜索 "${query}" 相关的 AI 工具和技能` : '输入关键词搜索 AI 工具、Skill、MCP…'}
          </p>
        </div>

        {/* Tab 行：全部 / 免费 / 评分最高 / 装机必备 */}
        <div className="px-8">
          
        </div>

        {/* 排序栏 */}
        {allResults.length > 0 && (
          <div className="px-8 py-3 flex items-center justify-between">
            <span className="text-[14px] text-[#666]">
              找到 <strong className="text-[#000] font-bold">{sorted.length}</strong> 个相关工具
              {filtered.length !== allResults.length && (
                <span className="text-[#FF8C00]"> · 筛选后 {sorted.length} 个</span>
              )}
            </span>
          </div>
        )}

        {/* 主体 */}
        {allResults.length > 0 ? (
          <div className="px-8 pb-8">
            {sorted.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
                {sorted.map((skill) => (
                  <SkillCardComponent key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <NoFilterResults
                query={query}
                onClearFiltersHref={`/search?q=${encodeURIComponent(query)}`}
              />
            )}
          </div>
        ) : query ? (
          <NoSearchResults query={query} recommendations={recommendations} scenarios={scenarios} platforms={platforms} />
        ) : (
          <SearchLanding scenarios={scenarios} platforms={platforms} />
        )}
      </main>
    </div>
  )
  } catch (err) {
    console.error('SearchPage render error:', err)
    // 返回最小可用页面
    return (
      <div className="page-wrapper flex min-h-screen">
        <aside className="w-[220px] shrink-0 hidden lg:block sticky top-[108px] self-start"><div className="p-4 text-[13px] text-[#9CA3AF]">使用顶部筛选条件搜索</div></aside>
        <main className="flex-1 px-8 py-8">
          <h1 className="text-[20px] font-bold mb-2">搜索出错了</h1>
          <p className="text-[14px] text-[#9CA3AF]">错误信息: {String(err).substring(0, 200)}</p>
          <p className="text-[14px] text-[#9CA3AF] mt-2">请稍后重试，或<a href="/" className="text-[#FF8C00]">返回首页</a></p>
        </main>
      </div>
    )
  }
}

// ===== 筛选后无结果 =====
function NoFilterResults({ query, onClearFiltersHref }: { query: string; onClearFiltersHref: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-[72px] h-[72px] rounded-full content-card flex items-center justify-center mb-5 text-[#FF8C00]">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <h2 className="text-[18px] font-bold text-[#000] mb-2">当前筛选条件下没有结果</h2>
      <p className="text-[14px] text-[#888] mb-6 max-w-md">
        搜索 &ldquo;{query}&rdquo; 有结果，但加上筛选条件后没有匹配的 Skill。
      </p>
      <div className="flex gap-3">
        <Link href={onClearFiltersHref} className="btn-primary px-5 py-2.5 text-sm">
          清除筛选条件
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(query)}`}
          className="btn-outline px-5 py-2.5 text-sm"
        >
          重新搜索
        </Link>
      </div>
    </div>
  )
}

// ===== 搜索完全无结果（含推荐）=====
function NoSearchResults({
  query,
  recommendations,
  scenarios,
  platforms,
}: {
  query: string
  recommendations: SkillCard[]
  scenarios: { slug: string; name: string; icon?: string | null }[]
  platforms: { slug: string; name: string }[]
}) {
  return (
    <div className="px-8 pb-12">
      {/* 空状态主区 */}
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-[72px] h-[72px] rounded-full content-card flex items-center justify-center mb-5 text-[#FF8C00]">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[#000] mb-2">没有找到匹配的工具，但你可能感兴趣</h2>
        <p className="text-[14px] text-[#888] mb-7">试试更宽泛的关键词，或浏览以下精选推荐</p>
      </div>

      {/* 推荐区：编辑精选 */}
      {recommendations.length > 0 && (
        <section className="max-w-[680px] mx-auto">
          <div className="text-[13px] font-bold text-[#FF8C00] text-left mb-3.5 pl-1">编辑精选推荐</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recommendations.map((skill) => (
              <SkillCardComponent key={skill.id} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {/* 热门分类 */}
      {scenarios.length > 0 && (
        <section className="max-w-[680px] mx-auto mt-7">
          <div className="text-[13px] font-bold text-[#666] text-left mb-3">热门分类</div>
          <div className="flex gap-2 flex-wrap justify-start">
            {scenarios.slice(0, 8).map((s) => (
              <Link
                key={s.slug}
                href={`/scenario/${s.slug}`}
                className="content-card px-3.5 py-1.5 text-[12px] text-[#666] hover:text-[#FF8C00] transition cursor-pointer"
              >
                {SCENARIO_ICONS[s.slug] || s.icon || '🎯'} {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 平台 */}
      {platforms.length > 0 && (
        <section className="max-w-[680px] mx-auto mt-7">
          <div className="text-[13px] font-bold text-[#666] text-left mb-3">按平台浏览</div>
          <div className="flex gap-2 flex-wrap justify-start">
            {platforms.map((p) => (
              <Link key={p.slug} href={`/platform/${p.slug}`} className="content-card px-3.5 py-1.5 text-[12px] text-[#666] hover:text-[#FF8C00] transition">
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-[13px] text-[#999] mt-6">
        提示：试试 <strong className="text-[#FF8C00]">知识库</strong>、<strong className="text-[#FF8C00]">笔记</strong>、<strong className="text-[#FF8C00]">上下文</strong> 等更宽泛的关键词
      </p>
    </div>
  )
}

// ===== 初始状态（未搜索）=====
function SearchLanding({
  scenarios,
  platforms,
}: {
  scenarios: { slug: string; name: string; icon?: string | null }[]
  platforms: { slug: string; name: string }[]
}) {
  return (
    <div className="px-8 pb-12">
      <div className="text-center py-10">
        <h2 className="text-[26px] font-bold text-[#000] mb-2">搜索 528+ AI Skill</h2>
        <p className="text-[14px] text-[#888] mb-8">输入工具名、场景或关键词，找到最适合你的 AI 工具</p>
      </div>

      {/* 热门搜索 */}
      <section className="mb-10">
        <h3 className="text-[15px] font-bold text-[#000] mb-4 flex items-center gap-2">
          🔥 热门搜索
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {['写文案', 'AI画图', '做PPT', '视频制作', '写代码', '数据分析', '语音合成', '图片编辑', '自动化', '记忆增强'].map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="content-card px-4 py-1.5 text-[13px] text-[#666] hover:text-[#FF8C00] transition"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* 按场景 */}
      {scenarios.length > 0 && (
        <section className="mb-10">
          <h3 className="text-[15px] font-bold text-[#000] mb-4">📂 按场景找</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {scenarios.slice(0, 12).map((s) => (
              <Link
                key={s.slug}
                href={`/scenario/${s.slug}`}
                className="content-card p-4 flex flex-col items-center gap-2 group"
              >
                <span className="text-2xl">{SCENARIO_ICONS[s.slug] || s.icon || '🎯'}</span>
                <span className="text-sm text-[#666] group-hover:text-[#FF8C00] transition">{s.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 按平台 */}
      {platforms.length > 0 && (
        <section className="mb-10">
          <h3 className="text-[15px] font-bold text-[#000] mb-4">📍 按平台找</h3>
          <div className="flex flex-wrap gap-2.5">
            {platforms.map((p) => (
              <Link
                key={p.slug}
                href={`/platform/${p.slug}`}
                className="content-card px-4 py-2.5 flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[rgba(255,140,0,0.08)] flex items-center justify-center text-[10px] font-bold text-[#FF8C00]">
                  {p.name[0]}
                </span>
                <span className="text-sm text-[#666] font-medium">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
