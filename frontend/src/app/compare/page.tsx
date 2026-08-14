import type { Metadata } from 'next'
import {
  getSkillDetailsBySlugs,
  getFeaturedSkills,
} from '@/lib/supabase'
import AppSidebar from '@/components/AppSidebar'
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
  // 候选池：最近评测的 Skill
  const candidates = await getFeaturedSkills(60)

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* 标题板块 — 横跨全宽，对齐首页 */}
      <div className="pt-10 pb-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-2 text-[12px] text-[var(--fg3)] mb-4">
          <span>首页</span>
          <span>/</span>
          <span className="text-[var(--fg)]">工具对比</span>
        </nav>
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">Skill 对比</h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5">
          已选 {selected.length} 个工具 · 可添加至 3 个 · 数据基于 ArcDock 实测
        </p>
      </div>

      {/* 双栏 */}
      <div className="flex gap-8">
      <AppSidebar />
      <main className="flex-1 min-w-0 relative z-10 pb-10">
        <CompareClient initialSelected={selected} candidates={candidates} maxSelect={3} />
      </main>
      </div>
    </div>
  )
}
