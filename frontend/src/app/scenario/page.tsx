import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

/**
 * /scenario — 场景库列表页（footer「场景库」指向这里，替代此前直指 /scenario/content-creation 的错位）
 * 场景计数从 skill_cards_view 聚合，与首页场景 Tab 同口径。
 */

export const metadata: Metadata = {
  title: '场景库 — 按需求找 AI 工具 | ArcDock',
  description: '按场景浏览 AI 工具：写作创作、数据办公、研究分析、开发编程、设计媒体、自动化。',
  alternates: { canonical: '/scenario' },
}

export const revalidate = 3600

const ICONS: Record<string, string> = {
  'content-creation': '✍️',
  office: '📊',
  research: '🔬',
  code: '💻',
  design: '🎨',
  automation: '⚙️',
  'model-router': '🧠',
}

export default async function ScenarioListPage() {
  // 注：scenarios 表无 description 列（含 id/name/slug/icon/parent_id/sort_order），
  // 原 select('description') 会触发 42703 常驻失败导致页面永远空态，已改为只查有效列。
  let scenarios: { name: string; slug: string }[] = []
  let counts: Record<string, number> = {}
  try {
    const { data } = await supabase.from('scenarios').select('name, slug').order('sort_order')
    if (data) scenarios = data
    const { data: rows } = await supabase.from('skill_cards_view').select('scenario_slugs')
    if (rows) {
      for (const row of rows) {
        for (const s of (row.scenario_slugs || [])) counts[s] = (counts[s] || 0) + 1
      }
    }
  } catch (err) {
    // 构建/ISR 预渲染时 Supabase 不可达（ECS→Supabase 跨境网络不稳）：降级空态，绝不 rethrow 保 build
    console.warn('[build-degrade] /scenario 场景数据拉取失败，渲染空态', err)
    scenarios = []
    counts = {}
  }

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="pt-10 pb-8">
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">🧭 场景库</h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5">你打算用 AI 做什么？从场景出发找到合适的工具。</p>
      </div>
      {scenarios.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {scenarios.map((s) => (
            <Link
              key={s.slug}
              href={`/scenario/${s.slug}`}
              className="content-card block p-5 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[20px]">{ICONS[s.slug] || '📁'}</span>
                  <div className="text-[15px] font-medium text-[var(--fg)] group-hover:text-[var(--primary)] transition">{s.name}</div>
                </div>
                <span className="text-[12px] text-[var(--fg3)]">{counts[s.slug] || 0} 个</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="pb-10">
          <div className="content-card rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">🧭</div>
            <p className="text-[15px] font-medium text-[var(--fg2)] mb-1.5">场景内容加载中</p>
            <p className="text-[13px] text-[var(--fg3)]">数据拉取失败或尚未就绪，页面会自动重试刷新。</p>
          </div>
        </div>
      )}
    </div>
  )
}
