'use client'

import { useLearnProgress } from '@/hooks/useLearnProgress'
import {
  TOOL_PATHS,
  SCENE_PATHS,
  DIFFICULTY_META,
} from '@/lib/learn-paths'
import Link from 'next/link'

/**
 * 学习中心首页内容（客户端组件）
 * 使用 useLearnProgress 读取 localStorage 进度
 */
export default function LearnHomeClient() {
  const { mounted, pathProgress, isPathCompleted } = useLearnProgress()

  // 防止 SSR/CSR 不一致
  const progress = mounted ? pathProgress : () => 0
  const completed = mounted ? isPathCompleted : () => false

  return (
    <main className="flex-1 min-w-0 px-6 md:px-10 py-8">
      {/* 标题区 */}
        <div className="mb-8 pb-6 border-b border-[var(--border)]">
          <nav className="text-[12px] text-[var(--fg3)] mb-3">
            <Link href="/" className="hover:text-[var(--primary)]">首页</Link>
            <span> / </span>
            <span className="text-[var(--fg2)]">学习中心</span>
          </nav>
          <h1 className="text-[26px] font-bold text-[var(--fg)] mb-2" style={{ letterSpacing: '-0.5px' }}>
            🎓 学习中心
          </h1>
          <p className="text-[15px] text-[var(--fg2)] max-w-[640px] leading-relaxed">
            选择一条路径，闯关式学习。每完成一步解锁下一步，走完全程获得徽章。
          </p>

          {/* 难度说明 */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-[12px] text-[var(--fg3)]">难度分级：</span>
            {Object.entries(DIFFICULTY_META).map(([key, meta]) => (
              <span
                key={key}
                className="text-[13px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(var(--dim-rgb),0.10)', color: 'var(--primary)' }}
              >
                {meta.icon} {meta.label}
              </span>
            ))}
          </div>
        </div>

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
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#F0FDF4', color: '#059669' }}>
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
                        style={{ width: `${pct}%`, background: pct === 100 ? '#10B981' : 'var(--primary)' }}
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
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#F0FDF4', color: '#059669' }}>
                        🏅 已完成
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[var(--fg3)] mb-3 leading-relaxed">{path.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--bg2)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: pct === 100 ? '#10B981' : 'var(--primary)' }}
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
