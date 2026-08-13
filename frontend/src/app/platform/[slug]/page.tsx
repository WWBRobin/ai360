import { getSkillsByPlatform, getSkillsCountByPlatform, getPlatforms } from '@/lib/supabase'
import SkillCardComponent from '@/components/SkillCard'
import ScenarioFilter from '@/components/ScenarioFilter'
import SelectionGuide from '@/components/SelectionGuide'
import Pagination from '@/components/Pagination'
import type { Metadata } from 'next'
import type { SkillCard } from '@/types'

// Bug2: 平台页分页，每页 24 条（3列×8行）
const PAGE_SIZE = 24

// ISR：平台页每 10 分钟增量静态重新生成
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
    alternates: {
      canonical: `/platform/${slug}`,
    },
    openGraph: {
      title: `${title} · AI360`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · AI360`,
      description,
    },
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

  // Bug2: 分页参数
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1)

  // 获取总数 + 当前页数据（并行）
  const [totalCount, currentPageSkills, platforms] = await Promise.all([
    getSkillsCountByPlatform(slug),
    getSkillsByPlatform(slug, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    getPlatforms(),
  ])
  const platform = platforms.find((p) => p.slug === slug)

  if (!platform) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">平台不存在</div>

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const skills = sortSkills(currentPageSkills, sort)

  // 保留的查询参数（sort），给分页组件用
  const paginationParams: Record<string, string | undefined> = {
    sort: typeof sp.sort === 'string' ? sp.sort : undefined,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <div className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-indigo-500">首页</a> / {platform.name}
      </div>

      {/* 标题 */}
      <h1 className="text-2xl font-bold mb-1">{platform.name}</h1>
      <p className="text-gray-500 text-sm mb-2">{platform.description}</p>
      <p className="text-sm text-gray-400 mb-6">{totalCount} 个已评测 Skill{totalPages > 1 && ` · 第 ${page}/${totalPages} 页`}</p>

      {/* 平台切换 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {platforms.map((p) => (
          <a
            key={p.slug}
            href={`/platform/${p.slug}`}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              p.slug === slug
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.name}
          </a>
        ))}
      </div>

      {/* 排序栏（平台页不需要平台筛选） */}
      {totalCount > 0 && (
        <div className="border-y border-gray-100">
          <ScenarioFilter total={currentPageSkills.length} showPlatformFilter={false} />
        </div>
      )}

      {/* Skill 列表 */}
      {skills.length > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <SkillCardComponent key={skill.id} skill={skill} />
            ))}
          </div>

          {/* Bug2: 分页 */}
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
          <p className="text-gray-400">该平台暂无已评测 Skill</p>
          <p className="text-gray-400 text-sm mt-2">我们正在持续收录中</p>
        </div>
      )}

      {/* 底部选型建议：仅第一页展示（基于当前页数据，避免全量加载） */}
      {skills.length > 0 && page === 1 && <SelectionGuide skills={currentPageSkills} />}
    </div>
  )
}
