'use client'

import { useLearnProgress } from '@/hooks/useLearnProgress'
import { TOOL_PATHS, SCENE_PATHS } from '@/lib/learn-paths'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * 学习中心首页内容（客户端组件）
 * 使用 useLearnProgress 读取 localStorage 进度
 */
export default function LearnHomeClient() {
  const { mounted, pathProgress, isPathCompleted } = useLearnProgress()

  // 评测引导条：未登录 或 已登录但未评测（user_profiles.level 为空）时显示
  const [showAssessBanner, setShowAssessBanner] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
      if (cancelled) return
      if (!data.session) {
        setShowAssessBanner(true) // 未登录：显示引导
        return
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('level')
        .eq('id', data.session.user.id)
        .maybeSingle()
      if (cancelled) return
      setShowAssessBanner(!profile?.level) // 已评测则不显示
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 防止 SSR/CSR 不一致
  const progress = mounted ? pathProgress : () => 0
  const completed = mounted ? isPathCompleted : () => false

  return (
    <main className="flex-1 min-w-0 pb-10">
        {/* 评测引导条（非侵入） */}
        {showAssessBanner && (
          <Link
            href="/assessment"
            className="flex items-center justify-between gap-3 px-4 py-3 mb-6 rounded-[10px] border border-[var(--border)] hover:border-[var(--primary)] transition-colors group"
            style={{ background: 'var(--card)' }}
          >
            <span className="text-[13px] text-[var(--fg2)]">
              🎯 测测你的 AI 等级（30 秒 · 5 道题），获得个性化推荐
            </span>
            <span className="text-[13px] font-medium shrink-0 group-hover:underline" style={{ color: 'var(--primary)' }}>
              去评测 →
            </span>
          </Link>
        )}

        {/* 两条路径入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* 按工具学 */}
          <Link
            href="#tool-paths"
            className="content-card block p-6 group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[22px]"
                style={{ background: 'rgba(var(--dim-rgb),0.10)' }}
              >
                🔧
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[var(--fg)] group-hover:text-[var(--primary)] transition">
                  按工具学
                </h2>
                <p className="text-[13px] text-[var(--fg3)]">深入了解每个平台的玩法</p>
              </div>
            </div>
            <p className="text-[13px] text-[var(--fg2)] leading-relaxed">
              Hermes、扣子、Claude Skills、GPTs — 从安装到精通，每个平台一条完整路径。
            </p>
            <div className="mt-3 text-[13px] text-[var(--primary)] font-medium">
              {TOOL_PATHS.length} 个平台路径 →
            </div>
          </Link>

          {/* 按场景学 */}
          <Link
            href="#scene-paths"
            className="content-card block p-6 group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[22px]"
                style={{ background: 'rgba(var(--dim-rgb),0.10)' }}
              >
                🎯
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[var(--fg)] group-hover:text-[var(--primary)] transition">
                  按场景学
                </h2>
                <p className="text-[13px] text-[var(--fg3)]">不知道用什么工具？从需求出发</p>
              </div>
            </div>
            <p className="text-[13px] text-[var(--fg2)] leading-relaxed">
              用 AI 写文章、搭建 Agent、自动化工作、分析数据 — 按你要做的事来学。
            </p>
            <div className="mt-3 text-[13px] text-[var(--primary)] font-medium">
              {SCENE_PATHS.length} 个场景路径 →
            </div>
          </Link>
        </div>

        {/* 星图模式 — 标杆星入口（v3 新） */}
        <section className="mb-10">
          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-[18px] font-bold text-[var(--fg)]">⭐ 星图模式</h2>
            <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.14)', color: '#b45309' }}>指导手册 · 新</span>
          </div>
          <a
            href="/learn/star/xhs-note"
            className="group block rounded-[10px] border border-[var(--border)] p-5 transition-colors hover:border-[var(--primary)]"
            style={{ background: 'var(--card)', textDecoration: 'none' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[20px] leading-none">📝</span>
              <span className="text-[15px] font-bold text-[var(--fg)]">用 AI 写小红书笔记</span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.14)', color: '#b45309' }}>
                9.6 分 · 标杆星
              </span>
            </div>
            <p className="text-[13px] text-[var(--fg3)] mt-2 leading-relaxed">
              5 盏灯走完全程：找对标 → 写文案 → 配图 → 提示词 → 数据复盘。每步自选工具（全维度评判矩阵），结果不满意随时 AI 诊断，走完点亮这颗星。
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {['找对标', '写文案', '配图', '提示词', '复盘'].map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(var(--dim-rgb),0.08)', color: 'var(--fg3)' }}>
                  {i + 1}. {s}
                </span>
              ))}
              <span className="ml-auto text-[12px] font-medium text-[var(--primary)] group-hover:underline">开始点亮 →</span>
            </div>
          </a>
        </section>

        {/* 按工具学 — 路径列表 */}
        <section id="tool-paths" className="mb-10 scroll-mt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-[18px] font-bold text-[var(--fg)]">🔧 按工具学</h2>
            <span className="text-[13px] text-[var(--fg3)]">{TOOL_PATHS.length} 条路径</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOOL_PATHS.map((path) => {
              const pct = progress(path.steps.map((s) => s.id))
              const done = completed(path.steps.map((s) => s.id))
              return (
                <Link
                  key={path.platform}
                  href={`/learn/tool/${path.platform}`}
                  className="content-card block p-5 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[20px]">{path.platformIcon}</span>
                      <h3 className="text-[15px] font-semibold text-[var(--fg)] group-hover:text-[var(--primary)] transition">
                        {path.platformName}
                      </h3>
                    </div>
                    {done && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                        🏅 已完成
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[var(--fg3)] mb-3 leading-relaxed">{path.description}</p>
                  {/* 进度条 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--bg2)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--primary)' }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--fg3)] tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                  <div className="mt-2 text-[12px] text-[var(--fg3)]">
                    {path.steps.length} 步 · 预估{' '}
                    {path.steps.reduce((acc, s) => acc + parseInt(s.estimatedTime) || 0, 0)} 分钟
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* 按场景学 — 路径列表 */}
        <section id="scene-paths" className="mb-10 scroll-mt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-[18px] font-bold text-[var(--fg)]">🎯 按场景学</h2>
            <span className="text-[13px] text-[var(--fg3)]">{SCENE_PATHS.length} 条路径</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCENE_PATHS.map((path) => {
              const pct = progress(path.steps.map((s) => s.id))
              const done = completed(path.steps.map((s) => s.id))
              return (
                <Link
                  key={path.slug}
                  href={`/learn/scene/${path.slug}`}
                  className="content-card block p-5 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[20px]">{path.icon}</span>
                      <h3 className="text-[15px] font-semibold text-[var(--fg)] group-hover:text-[var(--primary)] transition">
                        {path.name}
                      </h3>
                    </div>
                    {done && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                        🏅 已完成
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[var(--fg3)] mb-3 leading-relaxed">{path.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--bg2)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--primary)' }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--fg3)] tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                  <div className="mt-2 text-[12px] text-[var(--fg3)]">
                    {path.steps.length} 步 · 预估{' '}
                    {path.steps.reduce((acc, s) => acc + parseInt(s.estimatedTime) || 0, 0)} 分钟
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
  )
}
