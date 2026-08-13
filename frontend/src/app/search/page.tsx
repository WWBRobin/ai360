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
import SearchSidebar from '@/components/SearchSidebar'
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
        // 有试用优先
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
  // 分类
  const categoryMap = new Map<string, { name: string; count: number }>()
  // 平台
  const platformMap = new Map<string, { name: string; count: number }>()
  // 场景
  const scenarioMap = new Map<string, { name: string; count: number }>()
  // 试用
  let trialYes = 0
  let trialNo = 0

  for (const s of skills) {
    // 分类
    const cat = s.category || 'other'
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        name: CATEGORY_LABELS[cat] || cat,
        count: 0,
      })
    }
    categoryMap.get(cat)!.count++

    // 平台
    const pslug = s.platform_slug || 'unknown'
    if (!platformMap.has(pslug)) {
      platformMap.set(pslug, {
        name: s.platform_name || '其他',
        count: 0,
      })
    }
    platformMap.get(pslug)!.count++

    // 场景
    if (s.scenario_slugs && s.scenario_slugs.length > 0) {
      for (const sc of s.scenario_slugs) {
        if (!scenarioMap.has(sc)) {
          scenarioMap.set(sc, {
            name: sc,
            count: 0,
          })
        }
        scenarioMap.get(sc)!.count++
      }
    }

    // 试用
    if (s.trial_enabled) trialYes++
    else trialNo++
  }

  // 排序：数量降序
  const sortDesc = (a: { count: number }, b: { count: number }) => b.count - a.count

  return {
    categories: [...categoryMap.entries()]
      .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
      .sort(sortDesc),
    platforms: [...platformMap.entries()]
      .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
      .sort(sortDesc),
    scenarios: [...scenarioMap.entries()]
      .map(([slug, v]) => ({ slug, name: v.name, icon: SCENARIO_ICONS[slug] || '🎯', count: v.count }))
      .sort(sortDesc),
    trialCounts: { yes: trialYes, no: trialNo },
  }
}

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
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

  // 获取搜索结果（全集，用于构建 facets）
  const allResults = query ? await searchSkills(query) : []

  // 构建 facet 维度选项
  const facets = buildFacets(allResults)

  // 应用筛选
  const filtered = applyFilters(allResults, filters)

  // 排序
  const sorted = sortSkills(filtered, sort)

  // 空结果时的推荐数据（评分最高的精选）
  const recommendations =
    allResults.length === 0 && query
      ? await getFeaturedSkills(6).catch(() => [])
      : []

  // 场景列表（空结果推荐用）
  const scenarios = await getScenarios().catch(() => [])
  // 平台列表（空结果推荐用）
  const platforms = await getPlatforms().catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-indigo-600 transition">
          首页
        </Link>
        <span>›</span>
        <span className="text-gray-700">搜索</span>
        {query && (
          <>
            <span>›</span>
            <span className="text-gray-700">&ldquo;{query}&rdquo;</span>
          </>
        )}
      </nav>

      {/* 搜索框（页内大搜索框） */}
      <form action="/search" className="mb-6">
        <div className="relative flex items-center max-w-2xl">
          <input
            type="text"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="搜索工具名 / 场景 / 关键词..."
            className="w-full px-5 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition bg-white"
          />
          <button
            type="submit"
            className="absolute right-2 bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-600 transition whitespace-nowrap text-sm"
          >
            🔍 搜索
          </button>
        </div>
      </form>

      {/* 结果标题 */}
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          {query ? (
            <>
              搜索 &ldquo;<span className="text-indigo-600">{query}</span>&rdquo;
            </>
          ) : (
            '搜索 AI Skill'
          )}
        </h1>
        {allResults.length > 0 && (
          <span className="text-sm text-gray-400">
            共 {allResults.length} 个结果
            {filtered.length !== allResults.length && (
              <span className="text-indigo-500"> · 筛选后 {filtered.length} 个</span>
            )}
          </span>
        )}
      </div>

      {allResults.length > 0 ? (
        /* 有结果：侧边栏 + 卡片网格 */
        <div className="flex flex-col lg:flex-row gap-6">
          <SearchSidebar
            categories={facets.categories}
            platforms={facets.platforms}
            scenarios={facets.scenarios}
            trialCounts={facets.trialCounts}
            total={allResults.length}
          />

          <main className="flex-1 min-w-0">
            {sorted.length > 0 ? (
              <>
                {/* 移动端筛选触发器（简化提示） */}
                <div className="lg:hidden mb-3 text-sm text-gray-400">
                  👈 使用左侧筛选缩小范围 · 当前 {sorted.length} 个结果
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sorted.map((skill) => (
                    <SkillCardComponent key={skill.id} skill={skill} />
                  ))}
                </div>
              </>
            ) : (
              /* 筛选后无结果（但搜索有结果） */
              <NoFilterResults
                query={query}
                onClearFiltersHref={`/search?q=${encodeURIComponent(query)}`}
              />
            )}
          </main>
        </div>
      ) : query ? (
        /* 搜索完全无结果 */
        <NoSearchResults query={query} recommendations={recommendations} scenarios={scenarios} platforms={platforms} />
      ) : (
        /* 初始状态（无搜索词） */
        <SearchLanding scenarios={scenarios} platforms={platforms} />
      )}
    </div>
  )
}

// ===== 筛选后无结果 =====
function NoFilterResults({ query, onClearFiltersHref }: { query: string; onClearFiltersHref: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">当前筛选条件下没有结果</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-md">
        搜索 &ldquo;{query}&rdquo; 有结果，但加上筛选条件后没有匹配的 Skill。
      </p>
      <div className="flex gap-3">
        <Link
          href={onClearFiltersHref}
          className="bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-600 transition"
        >
          清除筛选条件
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(query)}`}
          className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-gray-300 transition"
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
    <div>
      {/* 空状态主区 */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          没有找到 &ldquo;{query}&rdquo; 的结果
        </h2>
        <p className="text-gray-500 mb-6 max-w-md">
          换个关键词试试，或者浏览下面的推荐内容。
        </p>
        {/* 搜索建议 */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xl">
          <span className="text-sm text-gray-400 self-center">试试：</span>
          {['写文案', '画图', '做PPT', '写代码', '视频制作', '数据分析'].map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* 推荐区：编辑精选 */}
      {recommendations.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-gray-900">⭐ 你可能感兴趣</h3>
            <span className="text-sm text-gray-400">编辑精选推荐</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((skill) => (
              <SkillCardComponent key={skill.id} skill={skill} />
            ))}
          </div>
        </section>
      )}

      {/* 推荐区：按场景浏览 */}
      {scenarios.length > 0 && (
        <section className="mt-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📂 按场景浏览</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {scenarios.slice(0, 12).map((s) => (
              <Link
                key={s.slug}
                href={`/scenario/${s.slug}`}
                className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition group"
              >
                <span className="text-2xl">{SCENARIO_ICONS[s.slug] || s.icon || '🎯'}</span>
                <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">
                  {s.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 推荐区：按平台浏览 */}
      {platforms.length > 0 && (
        <section className="mt-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📍 按平台浏览</h3>
          <div className="flex flex-wrap gap-3">
            {platforms.map((p) => (
              <Link
                key={p.slug}
                href={`/platform/${p.slug}`}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <span className="font-medium text-gray-700">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 底部引导 */}
      <section className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">🚀 不知道从哪开始？</h3>
        <p className="text-gray-500 text-sm mb-4">看看我们整理的装机必备清单</p>
        <Link
          href="/essential"
          className="inline-block bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-600 transition"
        >
          查看装机必备 →
        </Link>
      </section>
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
    <div>
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">搜索 {528}+ AI Skill</h2>
        <p className="text-gray-500 mb-8">输入工具名、场景或关键词，找到最适合你的 AI 工具</p>
      </div>

      {/* 热门搜索 */}
      <section className="mb-12">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 热门搜索</h3>
        <div className="flex flex-wrap gap-3">
          {[
            '写文案', 'AI画图', '做PPT', '视频制作', '写代码',
            '数据分析', '语音合成', '图片编辑', '自动化', '记忆增强',
          ].map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-sm transition"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* 场景入口 */}
      {scenarios.length > 0 && (
        <section className="mb-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📂 按场景找</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {scenarios.slice(0, 12).map((s) => (
              <Link
                key={s.slug}
                href={`/scenario/${s.slug}`}
                className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition group"
              >
                <span className="text-2xl">{SCENARIO_ICONS[s.slug] || s.icon || '🎯'}</span>
                <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">
                  {s.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 平台入口 */}
      {platforms.length > 0 && (
        <section className="mb-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📍 按平台找</h3>
          <div className="flex flex-wrap gap-3">
            {platforms.map((p) => (
              <Link
                key={p.slug}
                href={`/platform/${p.slug}`}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <span className="font-medium text-gray-700">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
