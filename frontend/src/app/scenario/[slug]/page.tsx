import Link from 'next/link'
import type { Metadata } from 'next'
import { getSkillsByScenario, getScenarios } from '@/lib/supabase'
import { SCENARIO_ICONS } from '@/lib/supabase'
import SkillCardProto7 from '@/components/SkillCardProto7'
import AppSidebar from '@/components/AppSidebar'
import ScenarioTabs from '@/components/ScenarioTabs'
import FilterBar from '@/components/FilterBar'
import SelectionGuideProto7 from '@/components/SelectionGuideProto7'
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
function groupByPlatform(
  skills: SkillCard[]
): Map<string, { name: string; slug: string; skills: SkillCard[] }> {
  const groups = new Map<string, { name: string; slug: string; skills: SkillCard[] }>()
  for (const skill of skills) {
    const slug = skill.platform_slug || 'unknown'
    const name = skill.platform_name || '其他'
    if (!groups.has(slug)) {
      groups.set(slug, { name, slug, skills: [] })
    }
    groups.get(slug)!.skills.push(skill)
  }
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
    return scenarios.filter((s) => s.slug).map((s) => ({ slug: s.slug }))
  } catch {
    return Object.keys(SCENARIO_ICONS).map((slug) => ({ slug }))
  }
}

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
    alternates: { canonical: `/scenario/${slug}` },
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

interface ScenarioPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ScenarioPage(props: ScenarioPageProps) {
  const { slug } = await props.params
  const searchParams = await props.searchParams

  const platformFilter = typeof searchParams.platform === 'string' ? searchParams.platform : 'all'
  const sort = (typeof searchParams.sort === 'string' ? searchParams.sort : 'recommended') as SortKey

  const allSkills = await getSkillsByScenario(slug)
  const scenarios = await getScenarios().catch(() => [])
  const scenario = scenarios.find((s) => s.slug === slug)
  const scenarioName = scenario?.name || slug
  const scenarioIcon = SCENARIO_ICONS[slug] || '🎯'

  // 构建平台筛选选项
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

  const filtered = allSkills.filter(
    (s) => platformFilter === 'all' || s.platform_slug === platformFilter
  )

  // 空状态
  if (allSkills.length === 0) {
    return (
      <div className="flex min-h-screen relative">
        <AppSidebar />
        <main className="flex-1 min-w-0 relative z-10 px-8 py-7">
          <nav className="text-[12px] text-[#9CA3AF] mb-3.5">
            <Link href="/" className="hover:text-[#C99700]">首页</Link>
            <span> / </span>
            <span className="text-[#6B7280]">{scenarioName}</span>
          </nav>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">{scenarioIcon}</div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">「{scenarioName}」场景暂无评测</h1>
            <p className="text-[#6B7280] mb-8 max-w-md">
              我们正在加紧评测该场景下的 AI Skill，请稍后再来看看。
            </p>
            <div className="flex gap-3">
              <Link href="/" className="btn-primary px-5 py-2.5">浏览首页精选</Link>
              <Link href="/" className="btn-outline px-5 py-2.5">查看全部场景</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const sorted = sortSkills(filtered, sort)
  const groups = groupByPlatform(sorted)
  const siblingScenarios = scenarios.filter((s) => s.slug !== slug).slice(0, 6)

  // 场景 Tab 数据（7 大场景，基于数据库 scenarios）
  const sceneTabs = scenarios.length > 0
    ? scenarios.map((s) => ({ slug: s.slug, name: s.name, count: s.skill_count ?? 0 }))
    : []

  return (
    <div className="flex min-h-screen relative">
      <AppSidebar />

      <main className="flex-1 min-w-0 relative z-10 px-8 py-7 max-w-[1080px]">
        {/* 面包屑 */}
        <nav className="text-[12px] text-[#9CA3AF] mb-3.5">
          <Link href="/" className="hover:text-[#C99700]">首页</Link>
          <span> / </span>
          <span className="text-[#6B7280]">{scenarioName}</span>
        </nav>

        {/* 标题区 */}
        <div className="mb-6 pb-5 border-b border-[#EEF0F3]">
          <h1 className="text-[26px] font-bold text-[#1A1A1A] mb-2.5" style={{ letterSpacing: '-0.5px' }}>
            <span className="mr-2">{scenarioIcon}</span>
            {scenarioName}
            <span className="text-[14px] font-normal text-[#9CA3AF] ml-2">
              · {allSkills.length} 个 Skill
            </span>
          </h1>
          <p className="text-[15px] text-[#6B7280] max-w-[680px] leading-[1.7]">
            {scenarioName}场景下的 AI Skill 横向对比，按平台分组展示，帮你快速找到最适合的方案。
          </p>
        </div>

        {/* 双行 Tab：场景 7 + 类型 4 */}
        {sceneTabs.length > 0 && <ScenarioTabs scenes={sceneTabs} activeScene={slug} />}

        {/* 排序栏 */}
        <FilterBar platforms={platformOptions} total={filtered.length} />

        {/* 按平台分组卡片网格（双列 content-card） */}
        <div className="mt-5 space-y-8">
          {groups.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-medium text-[#6B7280] mb-2">没有符合条件的结果</p>
              <p className="text-sm text-[#9CA3AF]">当前筛选条件下没有 Skill，试试切换平台或排序方式。</p>
            </div>
          ) : (
            [...groups.entries()].map(([pslug, group]) => (
              <section key={pslug}>
                <div className="mb-3.5 flex items-center gap-2.5">
                  <h2 className="text-[16px] font-semibold text-[#1A1A1A]">{group.name}</h2>
                  <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-medium text-[#6B7280]">
                    {group.skills.length} 个
                  </span>
                  {platformRank(pslug) <= 2 && (
                    <span className="rounded-full bg-[rgba(201,151,0,0.10)] px-2.5 py-0.5 text-[11px] font-medium text-[#C99700]">
                      主流平台
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {group.skills.map((skill) => (
                    <SkillCardProto7 key={skill.id} skill={skill} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* 底部选型建议区（content-card 4 卡片） */}
        <SelectionGuideProto7 skills={filtered} scenarioName={scenarioName} />

        {/* 相关场景推荐 */}
        {siblingScenarios.length > 0 && (
          <section className="mt-12 pt-6 border-t border-[#EEF0F3]">
            <h2 className="mb-4 text-[16px] font-semibold text-[#1A1A1A]">浏览其他场景</h2>
            <div className="flex flex-wrap gap-2.5">
              {siblingScenarios.map((s) => (
                <Link
                  key={s.slug}
                  href={`/scenario/${s.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] border border-[#F0F0F0] px-4 py-2 text-sm text-[#6B7280] transition hover:border-[#C99700] hover:text-[#C99700]"
                >
                  <span>{SCENARIO_ICONS[s.slug] || '🎯'}</span>
                  {s.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
