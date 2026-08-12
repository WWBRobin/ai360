import type { Metadata } from 'next'
import {
  getSkillDetailsBySlugs,
  getFeaturedSkills,
} from '@/lib/supabase'
import CompareClient from '@/components/CompareClient'

// 对比页：低优先级索引（聚合页，内容随选择变化）
export const metadata: Metadata = {
  title: 'Skill 对比 — 5 问评测并排比较',
  description:
    '选 2-3 个 AI Skill 并排对比：场景、上手难度、稳定性、免费额度、Token 成本，一屏看清哪个更好。',
  alternates: { canonical: '/compare' },
  robots: { index: true, follow: true },
}

// 对比页不缓存（选择是高度动态的）
export const dynamic = 'force-dynamic'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>
}) {
  const sp = await searchParams
  const raw = sp.slugs || ''
  // 逗号分隔，去重，上限 3
  const slugs = Array.from(new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))).slice(0, 3)

  // 已选 Skill 的详情（服务端预取，首屏直出 + SEO 友好）
  const selected = await getSkillDetailsBySlugs(slugs)

  // 候选池：最近评测的 Skill（供选择器下拉）。取多一点便于搜索。
  const candidates = await getFeaturedSkills(60)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 标题 */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <span>⚖️</span> Skill 对比
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm md:text-base">
          选 2-3 个 Skill，5 维度并排对比，一眼看清哪个更适合你。
        </p>
      </header>

      <CompareClient initialSelected={selected} candidates={candidates} maxSelect={3} />
    </div>
  )
}
