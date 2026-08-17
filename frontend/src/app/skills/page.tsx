import Link from 'next/link'
import type { Metadata } from 'next'
import HomePortal from '@/sections/HomePortal'
import { supabase } from '@/lib/supabase'
import type { SkillCard } from '@/types'

export const revalidate = 300

export const metadata: Metadata = {
  title: '能力扩展库',
  description:
    '能力扩展库——已有 Agent 的高手进阶入口，Skill / MCP / 工具场景筛选、平台多选、等级标注与语义搜索。',
}

export default async function SkillsPage() {
  let totalCount = 0
  let platformCount = 0
  let sceneCounts: Record<string, number> = {}
  let skills: SkillCard[] = []

  try {
    // 与首页 / 同口径：一次拉全量，count/sceneCounts 本地算（跨境下避免 4 串行查询顶满 build 上限）
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
    console.warn('[build-degrade] /skills 数据拉取失败，渲染空态', err)
    skills = []
    totalCount = 0
    platformCount = 0
    sceneCounts = {}
  }

  return (
    <>
      {/* 说明条 — 独立对齐 page-wrapper（HomePortal 自带限宽，不能嵌套双层） */}
      <div className="page-wrapper px-4 sm:px-6 lg:px-8">
        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-4 py-2.5">
          <p className="text-[13px] text-[var(--fg2)]">
            <span className="font-semibold text-[var(--fg)]">能力扩展库</span>
            ——已有 Agent 的高手进阶入口，{totalCount > 0 ? `${totalCount} 个` : '559 个'} Skill/MCP
          </p>
          <Link
            href="/"
            className="shrink-0 text-[13px] text-[var(--primary)] hover:underline transition"
          >
            ← 返回首页
          </Link>
        </div>
      </div>

      {/* HomePortal 本体零触碰：场景Tab/平台多选/等级标注/搜索入口/559 工具流全部原样 */}
      <HomePortal
        totalCount={totalCount}
        platformCount={platformCount}
        sceneCounts={sceneCounts}
        skills={skills}
      />
    </>
  )
}
