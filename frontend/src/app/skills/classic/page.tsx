import Link from 'next/link'
import type { Metadata } from 'next'
import HomePortal from '@/sections/HomePortal'
import { supabase } from '@/lib/supabase'
import type { SkillCard } from '@/types'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Skill聚合 - ArcDock',
  description:
    'Skill聚合——ArcDock 经典目录视图：307 个 Skill/MCP/工具，场景筛选、平台多选、等级标注与语义搜索。',
}

/**
 * Skill聚合经典视图（早期形态原样）：场景Tab + 307条 + 筛选 + 平台多选
 * 与 /skills（能力扩展库）共用 HomePortal，数据零复制
 */
export default async function SkillsClassicPage() {
  let totalCount = 0
  let platformCount = 0
  let sceneCounts: Record<string, number> = {}
  let skills: SkillCard[] = []

  try {
    // 与 /skills 同口径：一次拉全量，count/sceneCounts 本地算
    const { data: skillData } = await supabase
      .from('skill_cards_view')
      .select('*')
      .order('overall_score', { ascending: false, nullsFirst: false })

    if (skillData) {
      skills = skillData as unknown as SkillCard[]
      totalCount = skills.length
      for (const row of skills) {
        for (const slug of ((row as any).scenario_slugs || [])) {
          const key = String(slug)
          sceneCounts[key] = (sceneCounts[key] || 0) + 1
        }
      }
    }

    const { count: pCount } = await supabase
      .from('platforms')
      .select('id', { count: 'exact', head: true })
    if (pCount) platformCount = pCount
  } catch (err) {
    // 构建/ISR 预渲染时 Supabase 不可达：降级空数据，绝不 rethrow 保 build
    console.warn('[build-degrade] /skills/classic 数据拉取失败，渲染空态', err)
    skills = []
    totalCount = 0
    platformCount = 0
    sceneCounts = {}
  }

  return (
    <>
      {/* 说明条 — 独立对齐 page-wrapper */}
      <div className="page-wrapper px-4 sm:px-6 lg:px-8">
        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-4 py-2.5">
          <p className="text-[13px] text-[var(--fg2)]">
            <span className="font-semibold text-[var(--fg)]">Skill聚合</span>
            ——经典目录视图，{totalCount > 0 ? `${totalCount} 个` : '559 个'} Skill/MCP/工具
          </p>
          <Link
            href="/skills"
            className="shrink-0 text-[13px] text-[var(--primary)] hover:underline transition"
          >
            品类视图（AI软件/大模型）→
          </Link>
        </div>
      </div>

      {/* HomePortal 本体零触碰 */}
      <HomePortal
        totalCount={totalCount}
        platformCount={platformCount}
        sceneCounts={sceneCounts}
        skills={skills}
      />
    </>
  )
}
