import type { Metadata } from 'next'
import AppSidebar from '@/components/AppSidebar'
import LearnHomeClient from '@/components/learn/LearnHomeClient'
import { DIFFICULTY_META } from '@/lib/learn-paths'

export const metadata: Metadata = {
  title: '学习中心',
  description:
    '闯关式 AI 学习路径。按工具学（Hermes/扣子/Claude/GPTs）或按场景学（写文章/搭Agent/自动化/数据分析），每完成一步解锁下一步。',
  alternates: { canonical: '/learn' },
  openGraph: {
    title: '学习中心 · ArcDock',
    description: '闯关式 AI 学习路径 — 按工具学 / 按场景学',
    type: 'website',
  },
}

export default function LearnPage() {
  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* 标题板块 — 横跨全宽，对齐首页 */}
      <div className="pt-10 pb-8">
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">🎓 学习中心</h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5">选择一条路径，闯关式学习。每完成一步解锁下一步，走完全程获得徽章。</p>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-[12px] text-[var(--fg3)]">难度分级：</span>
          {Object.entries(DIFFICULTY_META).map(([key, meta]) => (
            <span key={key} className="text-[13px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(var(--dim-rgb),0.10)', color: 'var(--primary)' }}>
              {meta.icon} {meta.label}
            </span>
          ))}
        </div>
      </div>

      {/* 双栏 */}
      <div className="flex gap-8">
        <AppSidebar />
        <LearnHomeClient />
      </div>
    </div>
  )
}
