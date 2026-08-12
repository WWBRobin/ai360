import Link from 'next/link'
import type { Metadata } from 'next'
import { getSkillsByScenario, getScenarios } from '@/lib/supabase'
import { SCENARIO_ICONS } from '@/lib/supabase'
import SkillCardComponent from '@/components/SkillCard'
import ScenarioFilter from '@/components/ScenarioFilter'
import type { SkillCard } from '@/types'

// 平台分组优先级：扣子 > GPTs > 智谱 > 通义 > 其他按字母序
const PLATFORM_PRIORITY: Record<string, number> = {
  coze: 1,
  gpts: 2,
  chatgpt: 2,
  zhipu: 3,
  glm: 3,
  qianwen: 4,
  tongyi: 4,
}

function platformRank(slug: string): number {
  return PLATFORM_PRIORITY[slug.toLowerCase()] ?? 99
}

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
      // 综合：有评分优先，评分高优先；其次有评测时间优先
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

// 按平台分组并按优先级排序
function groupByPlatform(skills: SkillCard[]): Map<string, { name: string; slug: string; skills: SkillCard[] }> {
  const groups = new Map<string, { name: string; slug: string; skills: SkillCard[] }>()
  for (const skill of skills) {
    const slug = skill.platform_slug || 'unknown'
    const name = skill.platform_name || '其他'
    if (!groups.has(slug)) {
      groups.set(slug, { name, slug, skills: [] })
    }
    groups.get(slug)!.skills.push(skill)
  }
  // 排序：扣子/GPTs/... > 其他（按字母）
  return new Map(
    [...groups.entries()].sort((a, b) => {
      const ra = platformRank(a[0])
      const rb = platformRank(b[0])
      if (ra !== rb) return ra - rb
      return a[1].name.localeCompare(b[1].name, 'zh')
    })
  )
}

// ISR：场景页每 10 分钟增量静态重新生成
export const revalidate = 600

// 预生成常见场景页
export async function generateStaticParams() {
  try {
    const scenarios = await getScenarios()
    return scenarios
      .filter((s) => s.slug) // 过滤掉无 slug 的
      .map((s) => ({ slug: s.slug }))
  } catch {
    // 数据库不可用时至少预生成已知常见场景
    return Object.keys(SCENARIO_ICONS).map((slug) => ({ slug }))
  }
}

// SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const scenarios = await getScenarios().catch(() => [])
  const scenario = scenarios.find((s) => s.slug === slug)
  const name = scenario?.name || slug
  const icon = SCENARIO_ICONS[slug] || '🎯'

  const title = `${name}场景 — AI Skill 横评`
  const description = `${icon} ${name}场景下精选 AI Skill 横向对比：按平台分组展示扣子、GPTs 等 Skill，含上手难度、稳定性和免费额度评测。`

  return {
    title,
    description,
    alternates: {
      canonical: `/scenario/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

interface ScenarioPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ScenarioPage(props: ScenarioPageProps) {
  const { slug } = await props.params
  const searchParams = await props.searchParams

  // 解析筛选参数
  const platformFilter = typeof searchParams.platform === 'string' ? searchParams.platform : 'all'
  const sort = (typeof searchParams.sort === 'string' ? searchParams.sort : 'recommended') as SortKey

  // 获取该场景全部 Skill（用于计算筛选选项 + 筛选）
  const allSkills = await getSkillsByScenario(slug)

  // 场景信息
  const scenarios = await getScenarios().catch(() => [])
  const scenario = scenarios.find((s) => s.slug === slug)
  const scenarioName = scenario?.name || slug
  const scenarioIcon = SCENARIO_ICONS[slug] || '🎯'

  // 构建平台选项（基于全部数据统计，保证下拉不变）
  const platformOptions = [...allSkills].reduce<
    { slug: string; name: string; count: number }[]
  >((acc, skill) => {
    const pslug = skill.platform_slug || 'unknown'
    const existing = acc.find((p) => p.slug === pslug)
    if (existing) {
      existing.count++
    } else {
      acc.push({ slug: pslug, name: skill.platform_name || '其他', count: 1 })
    }
    return acc
  }, [])

  // 应用筛选
  const filtered = allSkills.filter(
    (s) => platformFilter === 'all' || s.platform_slug === platformFilter
  )

  // 空状态
  if (allSkills.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-indigo-600 transition">
            首页
          </Link>
          <span>›</span>
          <span className="text-gray-700">{scenarioName}</span>
        </nav>

        {/* 空状态 */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">{scenarioIcon}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            「{scenarioName}」场景暂无评测
          </h1>
          <p className="text-gray-500 mb-8 max-w-md">
            我们正在加紧评测该场景下的 AI Skill，请稍后再来看看。你也可以浏览其他场景或查看精选推荐。
          </p>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              浏览首页精选
            </Link>
            <Link
              href="/#categories"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 transition"
            >
              查看全部场景
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 排序 + 分组
  const sorted = sortSkills(filtered, sort)
  const groups = groupByPlatform(sorted)

  // 相关场景推荐（同级的其他场景）
  const siblingScenarios = scenarios.filter((s) => s.slug !== slug).slice(0, 6)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 1. 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition">
          首页
        </Link>
        <span>›</span>
        <span className="text-gray-700">{scenarioName}</span>
      </nav>

      {/* 2. 页面标题 */}
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
          <span className="text-4xl">{scenarioIcon}</span>
          {scenarioName}
          <span className="text-base font-normal text-gray-400">
            · {allSkills.length} 个 Skill
          </span>
        </h1>
        <p className="mt-2 text-gray-500">
          {scenarioName}场景下的 AI Skill 横向对比，按平台分组展示，帮你快速找到最适合的方案。
        </p>
      </div>

      {/* 3. 筛选栏 */}
      <div className="border-y border-gray-100">
        <ScenarioFilter
          platforms={platformOptions}
          total={filtered.length}
        />
      </div>

      {/* 4. 按平台分组展示 */}
      <div className="mt-8 space-y-10">
        {groups.size === 0 ? (
          // 筛选后无结果的空状态
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium text-gray-700 mb-2">没有符合条件的结果</p>
            <p className="text-sm text-gray-400">
              当前筛选条件下没有 Skill，试试切换平台或排序方式。
            </p>
          </div>
        ) : (
          [...groups.entries()].map(([pslug, group]) => (
            <section key={pslug}>
              {/* 平台分组标题 */}
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {group.name}
                </h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  {group.skills.length} 个
                </span>
                {platformRank(pslug) <= 2 && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                    主流平台
                  </span>
                )}
              </div>

              {/* Skill 网格 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.skills.map((skill) => (
                  <SkillCardComponent key={skill.id} skill={skill} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* 5. 相关场景推荐 */}
      {siblingScenarios.length > 0 && (
        <section className="mt-16 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            浏览其他场景
          </h2>
          <div className="flex flex-wrap gap-3">
            {siblingScenarios.map((s) => (
              <Link
                key={s.slug}
                href={`/scenario/${s.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                <span>{SCENARIO_ICONS[s.slug] || '🎯'}</span>
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
